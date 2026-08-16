package cz.vankotraining.knee;

import android.app.Activity;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.ScrollView;
import android.widget.TextView;

public final class DiagnosticActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        TextView view = new TextView(this);
        view.setText("Knee lifecycle diagnostika\n\n" + DiagnosticApplication.readTrace(this)
                + "\n\nPouze lokální technický trace. Neobsahuje filename, klienta, shareId ani obsah ZIPu.");
        view.setTextSize(16f);
        view.setGravity(Gravity.START);
        view.setPadding(40, 40, 40, 40);
        view.setTextIsSelectable(true);

        ScrollView scrollView = new ScrollView(this);
        scrollView.addView(view);
        setContentView(scrollView);
    }
}
