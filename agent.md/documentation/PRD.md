# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## AURA Pod IoT Monitoring Dashboard

**STATUS: DRAFT SEMENTARA**

| | |
| --- | --- |
| **Nama Produk** | AURA Pod IoT Monitoring Dashboard |
| **Versi Dokumen** | v0.1 |
| **Disusun oleh** | Tim Pengembang AURA Pod (Pengembang) |
| **Untuk** | Tim AURA Pod / AlgaNova (Klien) |
| **Tanggal** | 14 September 2026 |
| **Dokumen Terkait** | Diskusi perancangan dashboard IoT AURA Pod dan desain prototype AURA Pod |

---

# 1. Ringkasan Produk (Overview)

AURA Pod merupakan prototype bioreaktor mikroalga yang menggunakan ESP32 dan sejumlah sensor untuk memantau kondisi kultur secara berkala. Kebutuhan utama yang dibahas adalah menyediakan tampilan monitoring yang lebih terstruktur sehingga data dari prototype tidak hanya terlihat pada perangkat fisik, tetapi dapat dipantau melalui dashboard IoT. Parameter yang dibahas dalam rancangan prototype meliputi suhu kultur menggunakan DS18B20, pemantauan gas menggunakan MQ-135, pH menggunakan modul PH-4502C, serta status perangkat seperti LED grow light dan aerator.

AURA Pod IoT Monitoring Dashboard akan menjadi panel pemantauan berbasis digital yang menampilkan status sistem, data sensor, tren data, dan informasi perangkat secara ringkas. Dashboard diarahkan menggunakan gaya visual dark clean-tech dengan aksen hijau, cyan, dan lime agar selaras dengan tema mikroalga, IoT, dan pemulihan lingkungan. Dashboard juga menyiapkan ruang untuk informasi MRV dan carbon monitoring, namun nilai carbon capture dan biomass yang bersifat terukur/terhitung belum ditetapkan metodenya dan karena itu tidak dianggap sebagai kebutuhan MVP yang sudah final.

# 2. Tujuan & Sasaran (Goals)

- Memusatkan data monitoring prototype AURA Pod dalam satu tampilan digital.
- Menyediakan informasi kondisi sistem secara cepat melalui status perangkat dan parameter sensor.
- Memudahkan pengamatan perubahan data sensor dari waktu ke waktu melalui grafik tren.
- Mendukung demonstrasi konsep IoT dan MRV AURA Pod dalam presentasi atau lomba.
- Menyediakan dasar tampilan untuk pengembangan monitoring carbon capture dan biomass pada tahap lanjutan setelah metode perhitungannya ditetapkan.

# 3. Pengguna & Peran (Users & Roles)

- **Pengguna Dashboard :** melihat status sistem, nilai sensor, dan tren monitoring AURA Pod.
- **Tim Pengembang/Operator :** menggunakan dashboard untuk memantau prototype selama pengujian dan demonstrasi.

# 4. Ruang Lingkup (Scope)

## 4.1 Termasuk (MVP)

- Dashboard overview yang menampilkan status online/offline perangkat dan ringkasan parameter utama.
- Monitoring data sensor suhu, pH, dan gas index dari prototype.
- Monitoring status perangkat utama seperti LED grow light dan aerator.
- Visualisasi tren data sensor secara real-time atau berkala sesuai data yang diterima sistem.
- Tampilan identitas perangkat/prototype AURA Pod dan waktu pembaruan data.

## 4.2 Di Luar Lingkup Awal / Fase Lanjutan

Perhitungan dan validasi carbon capture serta biomass berbasis metode kuantitatif yang final, alarm/notifikasi lanjutan, autentikasi pengguna, dan pengelolaan multi-perangkat belum ditetapkan sebagai bagian MVP dan dibahas sebagai kemungkinan fase lanjutan.

# 5. Asumsi & Batasan (Assumptions & Constraints)

- **Asumsi pengembang:** ESP32 menjadi sumber data utama dari sensor-sensor prototype dan dashboard menerima data melalui mekanisme komunikasi IoT yang dipilih tim.
- **Asumsi pengembang:** MQTT digunakan atau dipertimbangkan sebagai mekanisme pertukaran data IoT berdasarkan rancangan sistem yang telah dibahas, tetapi broker, hosting, dan konfigurasi detail belum ditetapkan.
- Prototype menggunakan MQ-135 untuk indikator gas/udara. Nilainya tidak boleh ditampilkan sebagai angka ppm CO₂ yang tervalidasi tanpa kalibrasi dan metode pengukuran CO₂ yang sesuai.
- Dashboard harus membedakan data pengukuran aktual dengan data estimasi/simulasi agar tidak terjadi klaim pengukuran yang belum tervalidasi.
- Detail stack frontend, backend, database, hosting, dan mekanisme autentikasi belum diputuskan.

# 6. Kebutuhan Fungsional (Functional Requirements)

## 6.1 Pengguna — Dashboard Overview

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **OVR-1** | Sistem menampilkan status koneksi prototype AURA Pod secara ringkas, termasuk status online/offline jika informasi koneksi tersedia. | **Wajib** |
| **OVR-2** | Sistem menampilkan waktu pembaruan data terakhir yang diterima dashboard. | **Wajib** |
| **OVR-3** | Sistem menampilkan ringkasan parameter utama AURA Pod dalam bentuk kartu monitoring. | **Wajib** |
| **OVR-4** | Sistem menampilkan identitas dashboard dan prototype AURA Pod secara konsisten. | **Penting** |

## 6.2 Pengguna — Monitoring Sensor

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **SNS-1** | Sistem menampilkan nilai suhu kultur dari sensor DS18B20. | **Wajib** |
| **SNS-2** | Sistem menampilkan nilai pH dari sensor/modul PH-4502C jika sensor terpasang dan data tersedia. | **Wajib** |
| **SNS-3** | Sistem menampilkan nilai MQ-135 sebagai indikator gas/udara, bukan sebagai klaim ppm CO₂ tervalidasi. | **Wajib** |
| **SNS-4** | Sistem menampilkan riwayat/tren data sensor berdasarkan waktu yang tersedia. | **Penting** |

## 6.3 Pengguna — Status Perangkat

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **DEV-1** | Sistem menampilkan status perangkat utama seperti LED grow light dan aerator apabila status tersebut dikirim oleh sistem. | **Wajib** |
| **DEV-2** | Sistem menampilkan status koneksi ESP32 apabila informasi tersebut tersedia. | **Wajib** |
| **DEV-3** | Sistem membedakan kondisi aktif, tidak aktif, atau tidak tersedia pada perangkat yang dimonitor. | **Penting** |

## 6.4 Pengguna — MRV & Data Lingkungan

| **ID** | **Kebutuhan Fungsional** | **Prioritas** |
| --- | --- | --- |
| **MRV-1** | Sistem menyediakan area tampilan untuk informasi monitoring dan verifikasi data AURA Pod. | **Penting** |
| **MRV-2** | Sistem dapat menampilkan nilai carbon capture atau biomass hanya jika sumber data dan metode perhitungannya telah ditetapkan. | **Fase 2** |

# 7. Alur Pengguna Utama (Key User Flows)

## 7.1 Membuka Dashboard AURA Pod

1. Pengguna membuka dashboard AURA Pod.
2. Sistem menampilkan halaman overview dan mencoba mengambil data terbaru dari sumber IoT.
3. Sistem menampilkan status koneksi dan waktu pembaruan data terakhir.
4. Sistem menampilkan kartu parameter utama yang tersedia.

## 7.2 Memantau Parameter Sensor

1. Pengguna melihat kartu suhu, pH, dan gas index pada halaman monitoring.
2. Sistem menampilkan nilai terbaru yang diterima dari sensor.
3. Pengguna membuka bagian tren data untuk melihat perubahan nilai berdasarkan waktu.

## 7.3 Memeriksa Status Perangkat

1. Pengguna membuka bagian status perangkat.
2. Sistem menampilkan status ESP32 dan perangkat utama yang datanya tersedia.
3. Pengguna dapat membandingkan status perangkat dengan data sensor yang masuk untuk kebutuhan pengujian dan demonstrasi.

# 8. Model Data (High-Level)

| **Entitas** | **Field Utama** | **Keterangan** |
| --- | --- | --- |
| **device** | device_id, device_name, connection_status, last_seen | Menyimpan identitas dan status koneksi perangkat AURA Pod. |
| **sensor_reading** | reading_id, device_id, sensor_type, value, unit, recorded_at | Menyimpan nilai sensor yang diterima dari perangkat. |
| **device_status** | status_id, device_id, component_name, status, recorded_at | Menyimpan status komponen seperti LED grow light dan aerator bila data status dikirim oleh sistem. |

**Catatan:** field dalam [tanda kurung siku] merupakan bagian dari fitur usulan/Fase Lanjutan (Bab 11). Tidak ada field fase lanjutan yang ditambahkan pada model MVP ini.

# 9. Kebutuhan Non-Fungsional (Non-Functional Requirements)

- **Keterbacaan :** informasi utama harus dapat dipahami dengan cepat melalui kartu nilai, status, dan grafik yang sederhana.
- **Responsivitas :** tampilan dashboard harus tetap dapat digunakan pada ukuran layar yang umum digunakan untuk demo dan monitoring; dukungan penuh perangkat mobile masih TBD.
- **Konsistensi visual :** antarmuka menggunakan identitas visual dark clean-tech dengan aksen hijau, cyan, dan lime agar konsisten dengan konsep AURA Pod.
- **Ketahanan koneksi :** dashboard harus menangani kondisi ketika data IoT terlambat atau tidak tersedia tanpa menampilkan nilai lama seolah-olah merupakan data terbaru.
- **Keamanan data :** mekanisme autentikasi dan otorisasi belum ditetapkan dan menjadi TBD sebelum sistem digunakan di luar kebutuhan prototype.

# 10. Integrasi Pihak Ketiga

| **Layanan** | **Fungsi** | **Catatan** |
| --- | --- | --- |
| **MQTT Broker** | Pertukaran data antara ESP32 dan dashboard. | Teknologi/protokol MQTT telah dibahas; penyedia broker, endpoint, dan konfigurasi belum ditetapkan. |
| **ESP32** | Sumber data sensor dan status perangkat prototype. | Bukan layanan pihak ketiga; dicantumkan sebagai sumber integrasi utama sistem. |

# 11. Fitur Usulan / Fase Lanjutan

- **Carbon Capture Quantification.** Menampilkan estimasi atau hasil perhitungan carbon capture setelah metode pengukuran, formula, sumber data, dan validasinya ditetapkan.
- **Biomass Analytics.** Menampilkan pertumbuhan biomassa secara kuantitatif setelah metode pengukuran biomassa dan sumber datanya ditetapkan.
- **Alert & Notification.** Memberikan peringatan saat parameter sensor keluar dari rentang yang ditentukan setelah threshold dan mekanisme notifikasi disepakati.
- **Multi-Device Monitoring.** Memungkinkan satu dashboard memantau beberapa unit AURA Pod.
- **Authentication & Role Management.** Membatasi akses berdasarkan peran pengguna apabila dashboard dikembangkan untuk penggunaan lebih luas.

# 12. Pertanyaan Terbuka / TBD

- Siapa pengguna final dashboard di luar tim pengembang/operator belum ditetapkan.
- Stack frontend, backend, database, dan hosting dashboard belum ditetapkan.
- Broker MQTT, alamat server, kredensial, dan struktur topic belum ditetapkan.
- Frekuensi pengiriman data dari ESP32 dan interval sampling setiap sensor belum ditetapkan.
- Metode kalibrasi dan interpretasi nilai MQ-135 belum ditetapkan untuk tujuan carbon monitoring.
- Metode pengukuran dan perhitungan biomass belum ditetapkan.
- Metode perhitungan carbon capture/MRV yang akan digunakan pada dashboard belum ditetapkan.
- Rentang threshold normal untuk suhu, pH, dan indikator gas belum ditetapkan.
- Apakah dashboard membutuhkan autentikasi pengguna belum ditetapkan.
- Apakah dashboard harus memiliki mode mobile penuh belum ditetapkan.

# 13. Glosarium

- **AURA Pod :** prototype bioreaktor mikroalga yang menjadi objek monitoring IoT pada proyek ini.
- **IoT (Internet of Things) :** pendekatan yang memungkinkan perangkat dan sensor mengirimkan data untuk dipantau melalui sistem digital.
- **ESP32 :** mikrokontroler yang digunakan sebagai pusat akuisisi dan komunikasi data pada prototype.
- **MQ-135 :** sensor kualitas udara yang digunakan pada prototype sebagai indikator gas/udara; tidak diperlakukan sebagai pengukur CO₂ ppm tervalidasi tanpa kalibrasi yang sesuai.
- **DS18B20 :** sensor suhu waterproof yang digunakan untuk mengukur suhu kultur.
- **PH-4502C :** modul antarmuka sensor pH yang digunakan untuk membaca kondisi pH kultur.
- **MQTT :** protokol messaging ringan yang dapat digunakan untuk pertukaran data antara perangkat IoT dan dashboard.
- **MRV :** Monitoring, Reporting, and Verification, yaitu pendekatan untuk memantau, melaporkan, dan memverifikasi data atau hasil sistem.
- **Gas Index :** nilai indikator relatif dari sensor MQ-135 untuk kebutuhan monitoring prototype.

---

*Dokumen ini merupakan draft sementara dan dapat berubah seiring pembahasan lebih lanjut dengan klien.*
