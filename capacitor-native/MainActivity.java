package com.aistudio.vuel.kzmprq;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends BridgeActivity implements TextToSpeech.OnInitListener {

    private TextToSpeech tts;
    private boolean ttsReady = false;
    private String pendingSpeakText = null;
    private String pendingSpeakLang = "en-US";
    private float pendingSpeakRate = 1.0f;
    private String pendingSpeakId = null;

    private SpeechRecognizer speechRecognizer;
    private String pendingSttLang = null;
    private long lastRmsEmitMs = 0L;
    private boolean bridgeAttached = false;

    private LinearLayout curriculumOverlay;
    private WebView curriculumWebView;
    private ProgressBar curriculumProgress;
    private String currentCurriculumUrl = "https://azm-study.free.nf";

    private final ActivityResultLauncher<String> requestMicPermissionLauncher =
        registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
            String lang = pendingSttLang;
            pendingSttLang = null;
            if (granted) {
                emitSttEvent("permission_granted", "");
                if (lang != null) {
                    startSpeechRecognizerInternal(lang);
                }
            } else {
                emitSttEvent("error", "permission_denied");
            }
        });

    private final ActivityResultLauncher<Intent> speechIntentFallbackLauncher =
        registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
            if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                ArrayList<String> matches = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                String text = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                emitSttEvent("result", text);
            } else {
                emitSttEvent("error", "code_7");
            }
        });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        tts = new TextToSpeech(this, this);
        attachVuelBridgeIfReady();
    }

    @Override
    public void onStart() {
        super.onStart();
        attachVuelBridgeIfReady();
    }

    private void attachVuelBridgeIfReady() {
        if (bridgeAttached) return;
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView wv = this.bridge.getWebView();
            wv.getSettings().setMediaPlaybackRequiresUserGesture(false);
            wv.addJavascriptInterface(new VuelNativeBridge(), "VuelBridge");
            bridgeAttached = true;
        }
    }

    private WebView getCapWebView() {
        return (this.bridge != null) ? this.bridge.getWebView() : null;
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS && tts != null) {
            ttsReady = true;
            try {
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();
                tts.setAudioAttributes(attrs);
            } catch (Exception ignored) {}

            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                    emitTtsEvent("start", utteranceId != null ? utteranceId : "", -1, -1);
                }

                @Override
                public void onRangeStart(String utteranceId, int start, int end, int frame) {
                    emitTtsEvent("range", utteranceId != null ? utteranceId : "", start, end);
                }

                @Override
                public void onDone(String utteranceId) {
                    emitTtsEvent("end", utteranceId != null ? utteranceId : "", -1, -1);
                }

                @Override
                public void onError(String utteranceId) {
                    emitTtsEvent("end", utteranceId != null ? utteranceId : "", -1, -1);
                }

                @Override
                public void onError(String utteranceId, int errorCode) {
                    emitTtsEvent("end", utteranceId != null ? utteranceId : "", -1, -1);
                }

                @Override
                public void onStop(String utteranceId, boolean interrupted) {
                    emitTtsEvent("end", utteranceId != null ? utteranceId : "", -1, -1);
                }
            });

            if (pendingSpeakText != null) {
                String t = pendingSpeakText;
                String l = pendingSpeakLang;
                float r = pendingSpeakRate;
                String id = pendingSpeakId;
                pendingSpeakText = null;
                speakInternal(t, l, r, id);
            }
        }
    }

    private void speakInternal(String text, String lang, float rate, String utteranceId) {
        runOnUiThread(() -> {
            if (tts == null || !ttsReady) return;
            try {
                Locale target = (lang != null && lang.startsWith("ar")) ? new Locale("ar") : Locale.US;
                int res = tts.setLanguage(target);
                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    int fallbackRes = tts.setLanguage(Locale.ENGLISH);
                    if (fallbackRes == TextToSpeech.LANG_MISSING_DATA || fallbackRes == TextToSpeech.LANG_NOT_SUPPORTED) {
                        tts.setLanguage(Locale.getDefault());
                    }
                }
                float clampedRate = Math.max(0.5f, Math.min(1.5f, rate));
                tts.setSpeechRate(clampedRate);
                Bundle params = new Bundle();
                params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
                int status = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
                if (status == TextToSpeech.ERROR) {
                    emitTtsEvent("end", utteranceId != null ? utteranceId : "", -1, -1);
                }
            } catch (Exception e) {
                emitTtsEvent("end", utteranceId != null ? utteranceId : "", -1, -1);
            }
        });
    }

    private void emitTtsEvent(String type, String id, int start, int end) {
        String safeType = JSONObject.quote(type);
        String safeId = JSONObject.quote(id);
        runOnUiThread(() -> {
            WebView wv = getCapWebView();
            if (wv != null) {
                wv.evaluateJavascript(
                    "window.__vuelNativeTtsEvent && window.__vuelNativeTtsEvent(" + safeType + ", " + safeId + ", " + start + ", " + end + ")",
                    null
                );
            }
        });
    }

    private void emitSttEvent(String type, String payload) {
        String safeType = JSONObject.quote(type);
        String safePayload = JSONObject.quote(payload);
        runOnUiThread(() -> {
            WebView wv = getCapWebView();
            if (wv != null) {
                wv.evaluateJavascript(
                    "window.__vuelNativeSttEvent && window.__vuelNativeSttEvent(" + safeType + ", " + safePayload + ")",
                    null
                );
            }
        });
    }

    private void startSpeechRecognizerInternal(String lang) {
        runOnUiThread(() -> {
            try {
                if (speechRecognizer != null) {
                    try { speechRecognizer.cancel(); } catch (Exception ignored) {}
                    try { speechRecognizer.destroy(); } catch (Exception ignored) {}
                    speechRecognizer = null;
                }

                if (SpeechRecognizer.isRecognitionAvailable(this)) {
                    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(this)) {
                    speechRecognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(this);
                } else {
                    emitSttEvent("error", "recognizer_unavailable");
                    return;
                }

                speechRecognizer.setRecognitionListener(new RecognitionListener() {
                    @Override public void onReadyForSpeech(Bundle params) { emitSttEvent("ready", ""); }
                    @Override public void onBeginningOfSpeech() { emitSttEvent("speech_start", ""); }

                    @Override
                    public void onRmsChanged(float rmsdB) {
                        long now = System.currentTimeMillis();
                        if (now - lastRmsEmitMs > 120L) {
                            lastRmsEmitMs = now;
                            emitSttEvent("rms", String.valueOf(rmsdB));
                        }
                    }

                    @Override public void onBufferReceived(byte[] buffer) {}
                    @Override public void onEndOfSpeech() { emitSttEvent("speech_end", ""); }
                    @Override public void onError(int error) { emitSttEvent("error", "code_" + error); }

                    @Override
                    public void onResults(Bundle results) {
                        ArrayList<String> matches = results != null ? results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) : null;
                        String text = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                        emitSttEvent("result", text);
                    }

                    @Override
                    public void onPartialResults(Bundle partialResults) {
                        ArrayList<String> matches = partialResults != null ? partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) : null;
                        String text = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                        if (text != null && !text.trim().isEmpty()) {
                            emitSttEvent("partial", text);
                        }
                    }

                    @Override public void onEvent(int eventType, Bundle params) {}
                });

                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang != null ? lang : "en-US");
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1400L);
                speechRecognizer.startListening(intent);
            } catch (Exception e) {
                emitSttEvent("error", "recognizer_unavailable");
            }
        });
    }

    private int dpToPx(int dp) {
        return Math.round(TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, dp, getResources().getDisplayMetrics()
        ));
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void showCurriculumOverlay(String url) {
        runOnUiThread(() -> {
            currentCurriculumUrl = (url != null && url.startsWith("http")) ? url : ("https://" + url);
            if (curriculumOverlay == null) {
                FrameLayout root = findViewById(android.R.id.content);
                if (root == null) return;

                curriculumOverlay = new LinearLayout(this);
                curriculumOverlay.setOrientation(LinearLayout.VERTICAL);
                curriculumOverlay.setBackgroundColor(Color.parseColor("#070B14"));

                FrameLayout.LayoutParams overlayLp = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                );
                overlayLp.bottomMargin = dpToPx(64);
                curriculumOverlay.setLayoutParams(overlayLp);

                LinearLayout topBar = new LinearLayout(this);
                topBar.setOrientation(LinearLayout.HORIZONTAL);
                topBar.setGravity(Gravity.CENTER_VERTICAL);
                topBar.setBackgroundColor(Color.parseColor("#0E1525"));
                topBar.setPadding(dpToPx(12), dpToPx(6), dpToPx(12), dpToPx(6));
                topBar.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(48)
                ));

                TextView title = new TextView(this);
                title.setText("📚 مناهج • azm-study.free.nf");
                title.setTextColor(Color.parseColor("#00E5FF"));
                title.setTextSize(13f);
                LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
                title.setLayoutParams(titleLp);

                TextView reloadBtn = new TextView(this);
                reloadBtn.setText("تحديث");
                reloadBtn.setTextColor(Color.parseColor("#F8FAFC"));
                reloadBtn.setTextSize(12f);
                reloadBtn.setPadding(dpToPx(10), dpToPx(6), dpToPx(10), dpToPx(6));
                reloadBtn.setOnClickListener(v -> {
                    if (curriculumWebView != null) curriculumWebView.reload();
                });

                TextView extBtn = new TextView(this);
                extBtn.setText("المتصفح");
                extBtn.setTextColor(Color.parseColor("#10B981"));
                extBtn.setTextSize(12f);
                extBtn.setPadding(dpToPx(10), dpToPx(6), dpToPx(6), dpToPx(6));
                extBtn.setOnClickListener(v -> {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(currentCurriculumUrl)));
                    } catch (Exception ignored) {}
                });

                topBar.addView(title);
                topBar.addView(reloadBtn);
                topBar.addView(extBtn);

                curriculumProgress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
                curriculumProgress.setMax(100);
                curriculumProgress.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(3)
                ));

                curriculumWebView = new WebView(this);
                curriculumWebView.setBackgroundColor(Color.parseColor("#070B14"));
                WebSettings s = curriculumWebView.getSettings();
                s.setJavaScriptEnabled(true);
                s.setDomStorageEnabled(true);
                s.setUseWideViewPort(true);
                s.setLoadWithOverviewMode(true);
                s.setBuiltInZoomControls(true);
                s.setDisplayZoomControls(false);
                curriculumWebView.setWebViewClient(new WebViewClient());
                curriculumWebView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onProgressChanged(WebView view, int newProgress) {
                        if (curriculumProgress != null) {
                            curriculumProgress.setProgress(newProgress);
                            curriculumProgress.setVisibility(newProgress < 100 ? View.VISIBLE : View.GONE);
                        }
                    }
                });
                curriculumWebView.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
                ));

                curriculumOverlay.addView(topBar);
                curriculumOverlay.addView(curriculumProgress);
                curriculumOverlay.addView(curriculumWebView);
                root.addView(curriculumOverlay);
            }

            curriculumOverlay.setVisibility(View.VISIBLE);
            curriculumWebView.loadUrl(currentCurriculumUrl);
        });
    }

    private void hideCurriculumOverlay() {
        runOnUiThread(() -> {
            if (curriculumOverlay != null) {
                curriculumOverlay.setVisibility(View.GONE);
            }
        });
    }

    public class VuelNativeBridge {
        @JavascriptInterface
        public boolean isNativeAndroid() {
            return true;
        }

        @JavascriptInterface
        public boolean isOnline() {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;
            if (cm.getActiveNetwork() == null) return false;
            NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
            return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        }

        @JavascriptInterface
        public boolean hasMicPermission() {
            return ContextCompat.checkSelfPermission(
                MainActivity.this,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED;
        }

        @JavascriptInterface
        public void requestMicPermission() {
            runOnUiThread(() -> requestMicPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO));
        }

        @JavascriptInterface
        public boolean speak(String text, String lang, float rate, String utteranceId) {
            if (tts == null) return false;
            if (!ttsReady) {
                pendingSpeakText = text;
                pendingSpeakLang = lang != null ? lang : "en-US";
                pendingSpeakRate = rate;
                pendingSpeakId = utteranceId;
                return true;
            }
            speakInternal(text, lang, rate, utteranceId);
            return true;
        }

        @JavascriptInterface
        public void stopSpeaking() {
            pendingSpeakText = null;
            runOnUiThread(() -> {
                if (tts != null) {
                    try { tts.stop(); } catch (Exception ignored) {}
                }
                emitTtsEvent("end", "", -1, -1);
            });
        }

        @JavascriptInterface
        public void startListening(String lang) {
            boolean granted = ContextCompat.checkSelfPermission(
                MainActivity.this,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED;
            if (!granted) {
                pendingSttLang = lang;
                runOnUiThread(() -> requestMicPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO));
            } else {
                startSpeechRecognizerInternal(lang);
            }
        }

        @JavascriptInterface
        public void launchVoicePrompt(String lang) {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang != null ? lang : "en-US");
                    intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "تحدث بالإنجليزية الآن • Speak now");
                    speechIntentFallbackLauncher.launch(intent);
                } catch (Exception e) {
                    emitSttEvent("error", "recognizer_unavailable");
                }
            });
        }

        @JavascriptInterface
        public void stopListening() {
            runOnUiThread(() -> {
                if (speechRecognizer != null) {
                    try { speechRecognizer.cancel(); } catch (Exception ignored) {}
                }
            });
        }

        @JavascriptInterface
        public void openCurriculum(String url) {
            showCurriculumOverlay(url);
        }

        @JavascriptInterface
        public void closeCurriculum() {
            hideCurriculumOverlay();
        }

        @JavascriptInterface
        public void openExternalUrl(String url) {
            runOnUiThread(() -> {
                try {
                    String target = (url != null && url.startsWith("http")) ? url : ("https://" + url);
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target)));
                } catch (Exception ignored) {}
            });
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception ignored) {}
        }
        if (speechRecognizer != null) {
            try { speechRecognizer.destroy(); } catch (Exception ignored) {}
        }
        if (curriculumWebView != null) {
            try { curriculumWebView.destroy(); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
