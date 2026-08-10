package com.dallounialayk.app;

import android.os.Bundle;
import android.view.Window;
import androidx.activity.EdgeToEdge;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ثبّت انتقال الـ splash ثم أخفِ أي شريط عنوان أصلي
        SplashScreen.installSplashScreen(this);
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);

        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);

        // تأكيد إخفاء ActionBar إن وُجد على بعض الأجهزة
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
    }
}
