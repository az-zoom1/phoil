package com.example

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.media.AudioAttributes
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import org.json.JSONObject
import java.util.Locale

class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {

    private var webView: WebView? = null
    private var curriculumWebView: WebView? = null
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var pendingSpeakText: String? = null
    private var pendingSpeakLang: String = "en-US"
    private var pendingSpeakRate: Float = 1.0f
    private var pendingSpeakId: String = ""

    private var speechRecognizer: SpeechRecognizer? = null
    private var pendingSttLang: String? = null
    private var lastRmsEmitMs = 0L

    private var showCurriculum by mutableStateOf(false)
    private var curriculumUrl by mutableStateOf("https://azm-study.free.nf")
    private var curriculumProgress by mutableIntStateOf(100)

    private val requestMicPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        val lang = pendingSttLang
        pendingSttLang = null
        if (granted) {
            emitSttEvent("permission_granted", "")
            if (lang != null) {
                startSpeechRecognizerInternal(lang)
            }
        } else {
            emitSttEvent("error", "permission_denied")
        }
    }

    private val speechIntentFallbackLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            val matches = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            val text = matches?.firstOrNull() ?: ""
            emitSttEvent("result", text)
        } else {
            emitSttEvent("error", "code_7")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.parseColor("#070B14")),
            navigationBarStyle = SystemBarStyle.dark(Color.parseColor("#070B14"))
        )

        tts = TextToSpeech(this, this)

        setContent {
            VuelHostScreen(
                onWebViewReady = { wv -> webView = wv },
                onCurriculumWebViewReady = { cwv -> curriculumWebView = cwv },
                onBackPressed = {
                    val cwv = curriculumWebView
                    if (showCurriculum && cwv != null) {
                        if (cwv.canGoBack()) {
                            cwv.goBack()
                        } else {
                            showCurriculum = false
                            webView?.evaluateJavascript("window.__vuelSwitchToStage && window.__vuelSwitchToStage()", null)
                        }
                        return@VuelHostScreen
                    }
                    val wv = webView
                    if (wv != null) {
                        wv.evaluateJavascript("window.__vuelHandleBack && window.__vuelHandleBack()") { result ->
                            if (result == "false" || result == "null") {
                                if (wv.canGoBack()) {
                                    wv.goBack()
                                } else {
                                    finish()
                                }
                            }
                        }
                    } else {
                        finish()
                    }
                }
            )
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            ttsReady = true
            try {
                val attrs = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
                tts?.setAudioAttributes(attrs)
            } catch (_: Exception) {}

            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    emitTtsEvent("start", utteranceId ?: "", -1, -1)
                }

                override fun onRangeStart(utteranceId: String?, start: Int, end: Int, frame: Int) {
                    emitTtsEvent("range", utteranceId ?: "", start, end)
                }

                override fun onDone(utteranceId: String?) {
                    emitTtsEvent("end", utteranceId ?: "", -1, -1)
                }

                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    emitTtsEvent("end", utteranceId ?: "", -1, -1)
                }

                override fun onError(utteranceId: String?, errorCode: Int) {
                    emitTtsEvent("end", utteranceId ?: "", -1, -1)
                }

                override fun onStop(utteranceId: String?, interrupted: Boolean) {
                    emitTtsEvent("end", utteranceId ?: "", -1, -1)
                }
            })

            val queued = pendingSpeakText
            if (queued != null) {
                pendingSpeakText = null
                speakInternal(queued, pendingSpeakLang, pendingSpeakRate, pendingSpeakId)
            }
        }
    }

    private fun speakInternal(text: String, lang: String, rate: Float, utteranceId: String) {
        runOnUiThread {
            val engine = tts
            if (!ttsReady || engine == null) return@runOnUiThread
            try {
                val locale = if (lang.startsWith("ar")) Locale("ar") else Locale.US
                val res = engine.setLanguage(locale)
                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    val fb = engine.setLanguage(Locale.ENGLISH)
                    if (fb == TextToSpeech.LANG_MISSING_DATA || fb == TextToSpeech.LANG_NOT_SUPPORTED) {
                        engine.setLanguage(Locale.getDefault())
                    }
                }
                engine.setSpeechRate(rate.coerceIn(0.5f, 1.5f))
                val params = Bundle().apply {
                    putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
                }
                val status = engine.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
                if (status == TextToSpeech.ERROR) {
                    emitTtsEvent("end", utteranceId, -1, -1)
                }
            } catch (_: Exception) {
                emitTtsEvent("end", utteranceId, -1, -1)
            }
        }
    }

    private fun emitTtsEvent(type: String, id: String, start: Int, end: Int) {
        val safeType = JSONObject.quote(type)
        val safeId = JSONObject.quote(id)
        runOnUiThread {
            webView?.evaluateJavascript(
                "window.__vuelNativeTtsEvent && window.__vuelNativeTtsEvent($safeType, $safeId, $start, $end)",
                null
            )
        }
    }

    private fun emitSttEvent(type: String, payload: String) {
        val safeType = JSONObject.quote(type)
        val safePayload = JSONObject.quote(payload)
        runOnUiThread {
            webView?.evaluateJavascript(
                "window.__vuelNativeSttEvent && window.__vuelNativeSttEvent($safeType, $safePayload)",
                null
            )
        }
    }

    private fun startSpeechRecognizerInternal(lang: String) {
        runOnUiThread {
            try {
                speechRecognizer?.let { existing ->
                    try { existing.cancel() } catch (_: Exception) {}
                    try { existing.destroy() } catch (_: Exception) {}
                }
                speechRecognizer = null

                val recognizer = when {
                    SpeechRecognizer.isRecognitionAvailable(this) ->
                        SpeechRecognizer.createSpeechRecognizer(this)
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                        SpeechRecognizer.isOnDeviceRecognitionAvailable(this) ->
                        SpeechRecognizer.createOnDeviceSpeechRecognizer(this)
                    else -> null
                }

                if (recognizer == null) {
                    emitSttEvent("error", "recognizer_unavailable")
                    return@runOnUiThread
                }

                speechRecognizer = recognizer.apply {
                    setRecognitionListener(object : RecognitionListener {
                        override fun onReadyForSpeech(params: Bundle?) {
                            emitSttEvent("ready", "")
                        }

                        override fun onBeginningOfSpeech() {
                            emitSttEvent("speech_start", "")
                        }

                        override fun onRmsChanged(rmsdB: Float) {
                            val now = System.currentTimeMillis()
                            if (now - lastRmsEmitMs > 120L) {
                                lastRmsEmitMs = now
                                emitSttEvent("rms", rmsdB.toString())
                            }
                        }

                        override fun onBufferReceived(buffer: ByteArray?) {}

                        override fun onEndOfSpeech() {
                            emitSttEvent("speech_end", "")
                        }

                        override fun onError(error: Int) {
                            emitSttEvent("error", "code_$error")
                        }

                        override fun onResults(results: Bundle?) {
                            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            val text = matches?.firstOrNull() ?: ""
                            emitSttEvent("result", text)
                        }

                        override fun onPartialResults(partialResults: Bundle?) {
                            val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            val text = matches?.firstOrNull() ?: ""
                            if (text.isNotBlank()) {
                                emitSttEvent("partial", text)
                            }
                        }

                        override fun onEvent(eventType: Int, params: Bundle?) {}
                    })
                }

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1400L)
                }
                speechRecognizer?.startListening(intent)
            } catch (_: Exception) {
                emitSttEvent("error", "recognizer_unavailable")
            }
        }
    }

    inner class VuelNativeBridge {
        @JavascriptInterface
        fun isNativeAndroid(): Boolean = true

        @JavascriptInterface
        fun isOnline(): Boolean {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        }

        @JavascriptInterface
        fun hasMicPermission(): Boolean {
            return ContextCompat.checkSelfPermission(
                this@MainActivity,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED
        }

        @JavascriptInterface
        fun requestMicPermission() {
            runOnUiThread {
                requestMicPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        }

        @JavascriptInterface
        fun speak(text: String, lang: String, rate: Float, utteranceId: String): Boolean {
            if (tts == null) return false
            if (!ttsReady) {
                pendingSpeakText = text
                pendingSpeakLang = lang
                pendingSpeakRate = rate
                pendingSpeakId = utteranceId
                return true
            }
            speakInternal(text, lang, rate, utteranceId)
            return true
        }

        @JavascriptInterface
        fun stopSpeaking() {
            pendingSpeakText = null
            runOnUiThread {
                tts?.stop()
                emitTtsEvent("end", "", -1, -1)
            }
        }

        @JavascriptInterface
        fun startListening(lang: String) {
            val granted = ContextCompat.checkSelfPermission(
                this@MainActivity,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                pendingSttLang = lang
                runOnUiThread {
                    requestMicPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                }
            } else {
                startSpeechRecognizerInternal(lang)
            }
        }

        @JavascriptInterface
        fun launchVoicePrompt(lang: String) {
            runOnUiThread {
                try {
                    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
                        putExtra(RecognizerIntent.EXTRA_PROMPT, "تحدث بالإنجليزية الآن • Speak now")
                    }
                    speechIntentFallbackLauncher.launch(intent)
                } catch (_: Exception) {
                    emitSttEvent("error", "recognizer_unavailable")
                }
            }
        }

        @JavascriptInterface
        fun stopListening() {
            runOnUiThread {
                speechRecognizer?.cancel()
            }
        }

        @JavascriptInterface
        fun openCurriculum(url: String) {
            runOnUiThread {
                val target = if (url.startsWith("http")) url else "https://$url"
                curriculumUrl = target
                showCurriculum = true
                curriculumWebView?.loadUrl(target)
            }
        }

        @JavascriptInterface
        fun closeCurriculum() {
            runOnUiThread {
                showCurriculum = false
            }
        }

        @JavascriptInterface
        fun openExternalUrl(url: String) {
            runOnUiThread {
                try {
                    val target = if (url.startsWith("http")) url else "https://$url"
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(target)))
                } catch (_: Exception) {}
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Composable
    private fun VuelHostScreen(
        onWebViewReady: (WebView) -> Unit,
        onCurriculumWebViewReady: (WebView) -> Unit,
        onBackPressed: () -> Unit
    ) {
        BackHandler { onBackPressed() }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(ComposeColor(0xFF070B14))
                .windowInsetsPadding(WindowInsets.safeDrawing)
        ) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { context ->
                    WebView(context).apply {
                        setBackgroundColor(Color.parseColor("#070B14"))
                        settings.apply {
                            javaScriptEnabled = true
                            domStorageEnabled = true
                            databaseEnabled = true
                            allowFileAccess = true
                            mediaPlaybackRequiresUserGesture = false
                            cacheMode = WebSettings.LOAD_DEFAULT
                            useWideViewPort = true
                            loadWithOverviewMode = true
                            setSupportZoom(false)
                        }
                        overScrollMode = WebView.OVER_SCROLL_NEVER
                        addJavascriptInterface(VuelNativeBridge(), "VuelBridge")
                        webViewClient = WebViewClient()
                        webChromeClient = object : WebChromeClient() {
                            override fun onPermissionRequest(request: PermissionRequest?) {
                                request?.grant(request.resources)
                            }

                            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                                return super.onConsoleMessage(consoleMessage)
                            }
                        }
                        loadUrl("file:///android_asset/index.html")
                        onWebViewReady(this)
                    }
                }
            )

            if (showCurriculum) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 64.dp)
                        .background(ComposeColor(0xFF070B14))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .background(ComposeColor(0xFF0E1525))
                            .padding(horizontal = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "📚 مناهج • azm-study.free.nf",
                            color = ComposeColor(0xFF00E5FF),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f)
                        )
                        TextButton(onClick = { curriculumWebView?.reload() }) {
                            Text("تحديث", color = ComposeColor(0xFFF8FAFC), fontSize = 12.sp)
                        }
                        Spacer(modifier = Modifier.width(4.dp))
                        TextButton(onClick = {
                            try {
                                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(curriculumUrl)))
                            } catch (_: Exception) {}
                        }) {
                            Text("المتصفح", color = ComposeColor(0xFF10B981), fontSize = 12.sp)
                        }
                    }

                    if (curriculumProgress < 100) {
                        LinearProgressIndicator(
                            progress = { curriculumProgress / 100f },
                            modifier = Modifier.fillMaxWidth().height(2.dp),
                            color = ComposeColor(0xFF00E5FF)
                        )
                    }

                    AndroidView(
                        modifier = Modifier.fillMaxSize(),
                        factory = { context ->
                            WebView(context).apply {
                                setBackgroundColor(Color.parseColor("#070B14"))
                                settings.apply {
                                    javaScriptEnabled = true
                                    domStorageEnabled = true
                                    useWideViewPort = true
                                    loadWithOverviewMode = true
                                    builtInZoomControls = true
                                    displayZoomControls = false
                                }
                                webViewClient = WebViewClient()
                                webChromeClient = object : WebChromeClient() {
                                    override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                        curriculumProgress = newProgress
                                    }
                                }
                                loadUrl(curriculumUrl)
                                onCurriculumWebViewReady(this)
                            }
                        }
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        speechRecognizer?.destroy()
        curriculumWebView?.destroy()
        webView?.destroy()
        super.onDestroy()
    }
}
