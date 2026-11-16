package com.example

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
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
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import org.json.JSONObject
import java.util.Locale

class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {

    private var webView: WebView? = null
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var speechRecognizer: SpeechRecognizer? = null
    private var pendingSttLang: String? = null

    private val requestMicPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        val lang = pendingSttLang
        pendingSttLang = null
        if (granted && lang != null) {
            startSpeechRecognizerInternal(lang)
        } else if (!granted) {
            emitSttEvent("error", "permission_denied")
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
                onBackPressed = {
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
            if (!SpeechRecognizer.isRecognitionAvailable(this)) {
                emitSttEvent("error", "unavailable")
                return@runOnUiThread
            }
            try {
                speechRecognizer?.destroy()
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
                    setRecognitionListener(object : RecognitionListener {
                        override fun onReadyForSpeech(params: Bundle?) {
                            emitSttEvent("ready", "")
                        }

                        override fun onBeginningOfSpeech() {
                            emitSttEvent("speech_start", "")
                        }

                        override fun onRmsChanged(rmsdB: Float) {}

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
                }
                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                emitSttEvent("error", e.message ?: "stt_exception")
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
        fun speak(text: String, lang: String, rate: Float, utteranceId: String): Boolean {
            if (!ttsReady || tts == null) return false
            runOnUiThread {
                val locale = if (lang.startsWith("ar")) Locale("ar") else Locale.US
                tts?.language = locale
                tts?.setSpeechRate(rate.coerceIn(0.5f, 1.5f))
                val params = Bundle()
                tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
            }
            return true
        }

        @JavascriptInterface
        fun stopSpeaking() {
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
                requestMicPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            } else {
                startSpeechRecognizerInternal(lang)
            }
        }

        @JavascriptInterface
        fun stopListening() {
            runOnUiThread {
                speechRecognizer?.stopListening()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Composable
    private fun VuelHostScreen(
        onWebViewReady: (WebView) -> Unit,
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
        }
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        speechRecognizer?.destroy()
        webView?.destroy()
        super.onDestroy()
    }
}
