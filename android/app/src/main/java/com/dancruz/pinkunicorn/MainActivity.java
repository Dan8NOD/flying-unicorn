package com.dancruz.pinkunicorn;

import android.os.Bundle;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // The paid shop pages appear only when the PinkStore plugin is registered (STORE_NATIVE in game.js).
    // A build with billing switched off (android/gradle.properties) shows Ring Looks only and sells nothing.
    @Override
    public void onCreate(Bundle savedInstanceState) {
        if (BuildConfig.PINK_STORE_BILLING) registerPlugin(PinkStorePlugin.class);
        super.onCreate(savedInstanceState);
    }

    // The game fills the screen: the status and navigation bars hide and come back with a swipe from an edge.
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) return;
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        bars.hide(WindowInsetsCompat.Type.systemBars());
    }
}
