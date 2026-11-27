package com.dancruz.pinkunicorn;

import android.util.Base64;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.BillingClient.ProductType;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// One-time character and weapon purchases through Google Play Billing. Called from game.js as "PinkStore",
// with the same methods and answers as ios/App/App/PinkStorePlugin.swift, plus "finish".
// Google holds the record of what a family owns, so nothing about the buyer is stored or sent by us.
//
// The rules this file keeps (docs/google-play.md, "Purchases"):
//  1. Only a purchase that is PURCHASED, for this app, and carries Google's signature counts as owned ("paid").
//     A PENDING one (cash, pay later) unlocks nothing.
//  2. The app acknowledges a purchase only in "finish", which game.js calls after it has saved the unlock.
//     Google refunds a purchase that is not acknowledged within three days.
//  3. "owned" and "restore" read what Google Play says is owned, so a reinstall or a new phone gets everything back,
//     and a purchase the app missed (closed mid-purchase, a pending payment that cleared) arrives on the next launch.
//  4. If Google Play cannot be reached, "owned" and "restore" fail instead of answering "nothing": the game keeps its saved list.
@CapacitorPlugin(name = "PinkStore")
public class PinkStorePlugin extends Plugin implements PurchasesUpdatedListener {
    private interface Ready { void run(boolean connected); }

    private BillingClient billing;
    private final List<Ready> waiting = new ArrayList<>();
    private boolean connecting;
    private PluginCall buying;    // the "buy" call that is waiting for Google's purchase sheet
    private String buyingId;

    @Override
    public void load() {
        billing = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
    }

    @Override
    protected void handleOnDestroy() {
        if (billing != null) billing.endConnection();
    }

    // Several calls can arrive while the first connection is still being made: they all wait for the one answer.
    private void connect(Ready then) {
        if (billing.isReady()) { then.run(true); return; }
        synchronized (waiting) {
            waiting.add(then);
            if (connecting) return;
            connecting = true;
        }
        billing.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) { connected(result.getResponseCode() == BillingResponseCode.OK); }
            @Override public void onBillingServiceDisconnected() { connected(false); }
        });
    }

    private void connected(boolean ok) {
        List<Ready> list;
        synchronized (waiting) {
            connecting = false;
            list = new ArrayList<>(waiting);
            waiting.clear();
        }
        for (Ready then : list) then.run(ok);
    }

    // Rule 1. Purchase reads its state, package and products out of the same JSON the signature covers.
    private boolean paid(Purchase purchase) {
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return false;
        if (!getContext().getPackageName().equals(purchase.getPackageName())) return false;
        try {
            return PlayReceipt.genuine(Base64.decode(BuildConfig.PLAY_LICENSE_KEY, Base64.DEFAULT), purchase.getOriginalJson(),
                Base64.decode(purchase.getSignature(), Base64.DEFAULT));
        } catch (IllegalArgumentException badBase64) {
            return false;
        }
    }

    private static List<String> idList(PluginCall call) {
        List<String> ids = new ArrayList<>();
        JSArray array = call.getArray("ids");
        if (array == null) return ids;
        for (int i = 0; i < array.length(); i++) {
            String id = array.optString(i, null);
            if (id != null && !id.isEmpty()) ids.add(id);
        }
        return ids;
    }

    private void details(List<String> ids, ProductsFound then) {
        List<QueryProductDetailsParams.Product> wanted = new ArrayList<>();
        for (String id : ids) wanted.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(ProductType.INAPP).build());
        billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(wanted).build(), (result, found) ->
            then.run(result.getResponseCode() == BillingResponseCode.OK ? found.getProductDetailsList() : Collections.<ProductDetails>emptyList()));
    }

    private interface ProductsFound { void run(List<ProductDetails> list); }

    @PluginMethod
    public void products(PluginCall call) {
        List<String> ids = idList(call);
        JSObject prices = new JSObject();
        JSObject answer = new JSObject();
        answer.put("prices", prices);
        answer.put("testMode", false);
        if (ids.isEmpty()) { call.resolve(answer); return; }
        connect(ok -> {
            if (!ok) { call.resolve(answer); return; }
            details(ids, list -> {
                for (ProductDetails product : list) {
                    ProductDetails.OneTimePurchaseOfferDetails offer = product.getOneTimePurchaseOfferDetails();
                    if (offer != null) prices.put(product.getProductId(), offer.getFormattedPrice());
                }
                call.resolve(answer);
            });
        });
    }

    private interface Purchases { void run(List<Purchase> list); }

    // Everything Google Play holds for this account and app, paid or pending. null: Google Play could not be asked.
    private void purchases(Purchases then) {
        connect(ok -> {
            if (!ok) { then.run(null); return; }
            billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(ProductType.INAPP).build(), (result, list) ->
                then.run(result.getResponseCode() == BillingResponseCode.OK ? list : null));
        });
    }

    // Rules 3 and 4.
    private void ownedIds(PluginCall call) {
        purchases(list -> {
            if (list == null) { call.reject("store unavailable"); return; }
            JSArray ids = new JSArray();
            for (Purchase purchase : list) if (paid(purchase)) for (String id : purchase.getProducts()) ids.put(id);
            JSObject answer = new JSObject();
            answer.put("ids", ids);
            call.resolve(answer);
        });
    }

    @PluginMethod
    public void owned(PluginCall call) { ownedIds(call); }

    @PluginMethod
    public void restore(PluginCall call) { ownedIds(call); }

    // Rule 2: the only place a purchase is acknowledged. game.js calls it after the unlock is saved.
    @PluginMethod
    public void finish(PluginCall call) {
        List<String> ids = idList(call);
        purchases(list -> {
            if (list != null) for (Purchase purchase : list) {
                if (purchase.isAcknowledged() || !paid(purchase) || Collections.disjoint(purchase.getProducts(), ids)) continue;
                billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.getPurchaseToken()).build(), result -> {});
            }
            call.resolve();
        });
    }

    private static void status(PluginCall call, String status) {
        JSObject answer = new JSObject();
        answer.put("status", status);
        call.resolve(answer);
    }

    @PluginMethod
    public void buy(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty() || buying != null) { status(call, "unavailable"); return; }
        connect(ok -> {
            if (!ok) { status(call, "unavailable"); return; }
            details(Collections.singletonList(id), list -> {
                ProductDetails product = null;
                for (ProductDetails found : list) if (id.equals(found.getProductId())) product = found;
                if (product == null || buying != null) { status(call, "unavailable"); return; }
                BillingFlowParams params = BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(
                    BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).build())).build();
                buying = call;
                buyingId = id;
                getActivity().runOnUiThread(() -> {
                    BillingResult launched = billing.launchBillingFlow(getActivity(), params);
                    if (launched.getResponseCode() != BillingResponseCode.OK) settle(launched.getResponseCode(), null);
                });
            });
        });
    }

    // Google's purchase sheet closed. Late news with no "buy" waiting (a pending payment cleared while the app was
    // open) needs nothing here: game.js asks "owned" on every launch and every time the app comes back.
    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> list) {
        settle(result.getResponseCode(), list);
    }

    private void settle(int code, List<Purchase> list) {
        PluginCall call;
        String id;
        synchronized (this) {
            call = buying;
            id = buyingId;
            buying = null;
            buyingId = null;
        }
        if (call == null) return;
        if (code == BillingResponseCode.USER_CANCELED) { status(call, "cancelled"); return; }
        if (code == BillingResponseCode.ITEM_ALREADY_OWNED) {   // bought before (or still pending): answer from what Google Play holds
            purchases(held -> status(call, outcome(id, held)));
            return;
        }
        status(call, code == BillingResponseCode.OK ? outcome(id, list) : "unavailable");
    }

    // "purchased" only under rule 1; "pending" grants nothing and game.js says the payment is pending.
    private String outcome(String id, List<Purchase> list) {
        String outcome = "unavailable";
        if (list != null) for (Purchase purchase : list) {
            if (!purchase.getProducts().contains(id)) continue;
            if (paid(purchase)) return "purchased";
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) outcome = "pending";
        }
        return outcome;
    }
}
