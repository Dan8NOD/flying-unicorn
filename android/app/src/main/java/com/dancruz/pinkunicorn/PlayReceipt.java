package com.dancruz.pinkunicorn;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;

// Checks Google's signature on a purchase, on the device, with the app's Play licensing key (a public key:
// Play Console > Monetize with Play > Monetization setup > Licensing). A purchase whose signature does not
// match was not made through Google Play for this app. Anything that goes wrong counts as "not genuine".
final class PlayReceipt {
    private PlayReceipt() {}

    // key: the licensing key's bytes (base64-decoded). json: Purchase.getOriginalJson(). signature: Purchase.getSignature(), base64-decoded.
    static boolean genuine(byte[] key, String json, byte[] signature) {
        if (key == null || key.length == 0 || json == null || json.isEmpty() || signature == null || signature.length == 0) return false;
        try {
            PublicKey publicKey = KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(key));
            Signature check = Signature.getInstance("SHA1withRSA");
            check.initVerify(publicKey);
            check.update(json.getBytes(StandardCharsets.UTF_8));
            return check.verify(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
