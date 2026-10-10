# Web Download App — rainkidz

Landing page + distribusi APK gratis via GitHub Pages dan GitHub Releases.

- **URL web:** https://rainkidz.github.io/app-download/
- **Cek update (API):** https://rainkidz.github.io/app-download/version.json
- **Repo:** https://github.com/rainkidz/app-download

---

## 1. Deploy Web (5 menit)

```bash
# dari folder ini
git init
git add .
git commit -m "init: web download app"
git branch -M main
git remote add origin https://github.com/rainkidz/app-download.git
git push -u origin main
```

Lalu di GitHub:

1. Buka repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)` → **Save**
4. Tunggu 1–2 menit, cek https://rainkidz.github.io/app-download/

## 2. Upload APK Pertama

1. Di repo → **Releases** → **Create a new release**
2. Tag: `v1.0.0` (buat tag baru saat publish)
3. Upload file `app-release.apk` (drag & drop)
4. **Publish release**
5. Klik kanan link asset → copy URL, harus seperti:
   `https://github.com/rainkidz/app-download/releases/download/v1.0.0/app-release.apk`

## 3. Isi `version.json`

Edit file `version.json` di root, lalu commit & push:

```json
{
  "versionCode": 1,
  "versionName": "1.0.0",
  "url": "https://github.com/rainkidz/app-download/releases/download/v1.0.0/app-release.apk",
  "size": 24576000,
  "checksum": "sha256:GANTI_DENGAN_CHECKSUM_ASLI",
  "changelog": ["Rilis perdana"],
  "forceUpdateBelow": 0,
  "minSdk": 24,
  "releasedAt": "2026-10-10"
}
```

| Field | Keterangan |
|---|---|
| `versionCode` | Sama dengan `versionCode` di `build.gradle` app |
| `versionName` | Versi tampil ke user, mis. `1.0.4` |
| `url` | Link direct APK dari GitHub Releases |
| `size` | Ukuran APK dalam **bytes** (dipakai web) |
| `checksum` | SHA-256 APK (opsional, verifikasi integritas) |
| `changelog` | Daftar perubahan (muncul di web) |
| `forceUpdateBelow` | Versi di bawah angka ini **wajib** update |
| `minSdk` | Minimal Android (API 24 = Android 7.0) |
| `releasedAt` | Tanggal rilis `YYYY-MM-DD` |

Ambil checksum & size:

```powershell
(Get-FileHash app-release.apk -Algorithm SHA256).Hash.ToLower()
(Get-Item app-release.apk).Length
```

## 4. Rilis Versi Berikutnya

1. Naikkan `versionCode` + `versionName` di `build.gradle` app
2. Build APK release
3. Buat Release baru (`v1.0.1`) + upload APK
4. Update `version.json` (versi, url, changelog) → commit & push

Web akan otomatis menampilkan versi terbaru (fetch `version.json` tanpa cache).

## 5. Integrasi Update Otomatis di App Android

Salin `android-update-checker/UpdateChecker.kt` ke project Anda, lalu tambahkan:

**`app/src/main/AndroidManifest.xml`**

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<application>
    <provider
        android:name="androidx.core.content.FileProvider"
        android:authorities="${applicationId}.fileprovider"
        android:exported="false"
        android:grantUriPermissions="true">
        <meta-data
            android:name="android.support.FILE_PROVIDER_PATHS"
            android:resource="@xml/file_paths" />
    </provider>
</application>
```

**`app/src/main/res/xml/file_paths.xml`** (buat folder `xml` kalau belum ada)

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-files-path name="updates" path="Download/" />
</paths>
```

**Pemanggilan** (misal di SplashScreen / MainActivity, butuh AppCompat + coroutines):

```kotlin
UpdateChecker.checkAndPrompt(this) { update ->
    update ?: Log.d("Update", "Sudah versi terbaru")
}
```

Build akan otomatis punya `BuildConfig.VERSION_CODE`.

## 6. Ganti Branding

| Cari | Ganti dengan |
|---|---|
| `Nama App` | Nama aplikasi Anda |
| `Deskripsi singkat aplikasi Anda di sini.` | Tagline Anda |
| `rainkidz` | Bisa tetap (nama developer) |
| `assets/icon.png`, `assets/screenshot-*.png` | Aset asli |
| Teks di section Fitur & Catatan Rilis | Sesuaikan |

Cari & ganti global string `Nama App` dan `com.example.app` (di UpdateChecker).

## 7. Batasan GitHub (yang perlu diketahui)

- Bandwidth Pages/Releases bersifat "fair use" — untuk ribuan download/bulan aman; kalau meledak (puluhan GB), pertimbangkan Cloudflare R2 (egress gratis 10GB+)
- APK per file maks **2GB** (jauh di atas kebutuhan Anda)
- Push langsung ke `main` langsung live; kalau ragu, test lokal dengan buka `index.html` di browser

## 8. Cek Lokal

Buka `index.html` langsung di browser, atau:

```powershell
python -m http.server 8000
# buka http://localhost:8000
```
