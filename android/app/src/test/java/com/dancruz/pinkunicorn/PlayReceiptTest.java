package com.dancruz.pinkunicorn;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;

// Run: cd android && ./gradlew :app:testDebugUnitTest
public class PlayReceiptTest {
    private static final String JSON = "{\"packageName\":\"com.dancruz.pinkunicorn\",\"productId\":\"com.dancruz.pinkunicorn.hero.coral\",\"purchaseState\":0}";

    private static KeyPair pair() throws Exception {
        KeyPairGenerator maker = KeyPairGenerator.getInstance("RSA");
        maker.initialize(2048);
        return maker.generateKeyPair();
    }

    private static byte[] sign(KeyPair pair, String text) throws Exception {
        Signature signer = Signature.getInstance("SHA1withRSA");
        signer.initSign(pair.getPrivate());
        signer.update(text.getBytes(StandardCharsets.UTF_8));
        return signer.sign();
    }

    @Test
    public void acceptsGooglesSignature() throws Exception {
        KeyPair google = pair();
        assertTrue(PlayReceipt.genuine(google.getPublic().getEncoded(), JSON, sign(google, JSON)));
    }

    @Test
    public void refusesAChangedReceipt() throws Exception {
        KeyPair google = pair();
        assertFalse(PlayReceipt.genuine(google.getPublic().getEncoded(), JSON.replace("coral", "ember"), sign(google, JSON)));
    }

    @Test
    public void refusesSomeoneElsesSignature() throws Exception {
        KeyPair google = pair(), other = pair();
        assertFalse(PlayReceipt.genuine(google.getPublic().getEncoded(), JSON, sign(other, JSON)));
    }

    @Test
    public void refusesWhenAnythingIsMissing() throws Exception {
        KeyPair google = pair();
        byte[] signature = sign(google, JSON);
        assertFalse(PlayReceipt.genuine(new byte[0], JSON, signature));
        assertFalse(PlayReceipt.genuine(null, JSON, signature));
        assertFalse(PlayReceipt.genuine(google.getPublic().getEncoded(), JSON, new byte[0]));
        assertFalse(PlayReceipt.genuine(google.getPublic().getEncoded(), "", signature));
        assertFalse(PlayReceipt.genuine(new byte[] { 1, 2, 3 }, JSON, signature));
    }
}
