package com.dallounialayk.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Android 15+ (targetSdk 35+): enable edge-to-edge with backward compatibility
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
