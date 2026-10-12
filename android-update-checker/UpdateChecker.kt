package com.example.app.update

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.content.FileProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class UpdateInfo(
    val versionCode: Int,
    val versionName: String,
    val url: String,
    val size: Long,
    val checksum: String,
    val changelog: List<String>,
    val forceUpdateBelow: Int
)

object UpdateChecker {

    private const val VERSION_URL =
        "https://rainkidz.github.io/app-download/apps/tubenime.json"

    suspend fun fetchUpdate(currentVersionCode: Int): UpdateInfo? = withContext(Dispatchers.IO) {
        try {
            val conn = (URL("$VERSION_URL?t=${System.currentTimeMillis()}").openConnection()
                    as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 15000
                readTimeout = 15000
            }
            if (conn.responseCode !in 200..299) return@withContext null

            val body = conn.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(body)

            val info = UpdateInfo(
                versionCode = json.optInt("versionCode", 0),
                versionName = json.optString("versionName", ""),
                url = json.optString("url", ""),
                size = json.optLong("size", 0L),
                checksum = json.optString("checksum", ""),
                changelog = json.optJSONArray("changelog")?.let { arr ->
                    (0 until arr.length()).map(arr::getString)
                } ?: emptyList(),
                forceUpdateBelow = json.optInt("forceUpdateBelow", 0)
            )

            if (info.versionCode > currentVersionCode && info.url.isNotBlank()) info else null
        } catch (e: Exception) {
            null
        }
    }

    fun showUpdateDialog(context: Context, info: UpdateInfo) {
        val forced = BuildConfig.VERSION_CODE < info.forceUpdateBelow
        val notes = if (info.changelog.isNotEmpty()) {
            "\n\nYang baru:\n" + info.changelog.joinToString("\n") { "• $it" }
        } else ""

        val dialog = AlertDialog.Builder(context)
            .setTitle("Update tersedia — ${info.versionName}")
            .setMessage("Versi baru aplikasi sudah bisa diunduh.$notes")
            .setPositiveButton("Update") { _, _ -> downloadAndInstall(context, info) }
            .setCancelable(!forced)

        if (!forced) {
            dialog.setNegativeButton("Nanti", null)
        }

        dialog.show()
    }

    fun checkAndPrompt(context: Context, onResult: (UpdateInfo?) -> Unit = {}) {
        CoroutineScope(Dispatchers.Main).launch {
            val current = BuildConfig.VERSION_CODE
            val update = fetchUpdate(current)
            if (update != null) showUpdateDialog(context, update)
            onResult(update)
        }
    }

    private fun downloadAndInstall(context: Context, info: UpdateInfo) {
        val fileName = "app-v${info.versionName}.apk"
        val target = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName)
        if (target.exists()) target.delete()

        val request = DownloadManager.Request(Uri.parse(info.url)).apply {
            setTitle("Mengunduh ${info.versionName}")
            setDescription("Aplikasi sedang diupdate...")
            setDestinationUri(Uri.fromFile(target))
            setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            )
        }

        val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val downloadId = dm.enqueue(request)

        val onComplete = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                context.unregisterReceiver(this)
                val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
                if (id != downloadId) return

                val apkUri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    target
                )

                val install = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(apkUri, "application/vnd.android.package-archive")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }

                try {
                    context.startActivity(install)
                } catch (e: Exception) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        val settings = Intent(
                            android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:${context.packageName}")
                        ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
                        context.startActivity(settings)
                    }
                    Toast.makeText(
                        context,
                        "Izinkan install dari sumber ini, lalu coba lagi",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(
                onComplete,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                Context.RECEIVER_NOT_EXPORTED
            )
        } else {
            context.registerReceiver(
                onComplete,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
            )
        }
    }
}
