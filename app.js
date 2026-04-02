// ACI 211 ve TS 802 Tabloları (Basitleştirilmiş Ortalama Değerler)

// Su İhtiyacı (Çökme Değeri ve MaksAgrega Çapına bağlı W kg/m3)
const WATER_REQUIREMENT = {
    "25": [207, 199, 190, 179, 166],   // S1 (Kuru)
    "75": [228, 216, 205, 193, 181],   // S2/S3 (Plastik)
    "150": [243, 228, 216, 202, 190]   // S4 (Akıcı)
};

// Sürüklenmiş Hava Yüzdesi
const ENTRAPPED_AIR = {
    "10": 0.03,
    "12.5": 0.025,
    "20": 0.02,
    "25": 0.015,
    "40": 0.01
};

// Basınç Dayanımına Göre W/C (Su/Çimento) Oranı
const WC_RATIO = {
    "15": 0.82,
    "20": 0.70,
    "25": 0.62,
    "30": 0.55,
    "35": 0.48,
    "40": 0.43
};

// İri Agrega Hacim Oranları (İncelik Modülüne göre)
const CA_VOLUME = {
    "10": {"2.40": 0.50, "2.60": 0.48, "2.80": 0.46, "3.00": 0.44},
    "12.5": {"2.40": 0.59, "2.60": 0.57, "2.80": 0.55, "3.00": 0.53},
    "20": {"2.40": 0.66, "2.60": 0.64, "2.80": 0.62, "3.00": 0.60},
    "25": {"2.40": 0.71, "2.60": 0.69, "2.80": 0.67, "3.00": 0.65},
    "40": {"2.40": 0.75, "2.60": 0.73, "2.80": 0.71, "3.00": 0.69}
};

const DMAX_INDEX = { "10": 0, "12.5": 1, "20": 2, "25": 3, "40": 4 };

let mixChart;

function calculateMix() {
    // Arayüzden parametreleri topla
    const fc = document.getElementById("fc").value;
    const slump = document.getElementById("slump").value;
    const dmax = document.getElementById("dmax").value;
    const fm = parseFloat(document.getElementById("fm").value).toFixed(2);
    
    const dr_ca = parseFloat(document.getElementById("dr_ca").value);
    const sg_c = parseFloat(document.getElementById("sg_c").value);
    const sg_ca = parseFloat(document.getElementById("sg_ca").value);
    const sg_fa = parseFloat(document.getElementById("sg_fa").value);
    
    // 1. Su Miktarı
    const dmax_idx = DMAX_INDEX[dmax];
    let water_kg = WATER_REQUIREMENT[slump][dmax_idx];
    
    // 2. W/C Oranı ve Çimento Hesabı
    let wc = WC_RATIO[fc];
    let cement_kg = water_kg / wc;
    
    // 3. İri Agrega Hesabı
    let vol_ca = CA_VOLUME[dmax][fm];
    let ca_kg = vol_ca * dr_ca;
    
    // 4. İnce Agrega Hesabı (Mutlak Hacim Yöntemi)
    let air_content = ENTRAPPED_AIR[dmax];
    
    let vol_water = water_kg / 1000;
    let vol_cement = cement_kg / (sg_c * 1000);
    let vol_ca_abs = ca_kg / (sg_ca * 1000);
    
    let known_vol = vol_water + vol_cement + vol_ca_abs + air_content;
    let vol_fa = 1.0 - known_vol; // 1 m³ içinden çıkar
    
    let fa_kg = vol_fa * sg_fa * 1000;
    
    if (vol_fa < 0) fa_kg = 0;
    
    // Toplam Kütle
    let total_weight = water_kg + cement_kg + ca_kg + fa_kg;
    
    updateUI({
        wc: wc.toFixed(2),
        water: Math.round(water_kg),
        cement: Math.round(cement_kg),
        ca: Math.round(ca_kg),
        fa: Math.round(fa_kg),
        total: Math.round(total_weight)
    });
}

function updateUI(results) {
    document.getElementById("summaryWc").innerHTML = `Su/Çimento (W/C) Oranı: <strong>${results.wc}</strong>`;
    
    // Karıştırma Oranları
    const cementRatio = 1.0;
    const waterRatio = (results.water / results.cement).toFixed(2);
    const faRatio = (results.fa / results.cement).toFixed(2);
    const caRatio = (results.ca / results.cement).toFixed(2);

    const tbody = document.getElementById("resultsTableBody");
    tbody.innerHTML = `
        <tr>
            <td>Çimento</td>
            <td>${results.cement} kg</td>
            <td>1.00</td>
        </tr>
        <tr>
            <td>Su</td>
            <td>${results.water} kg</td>
            <td>${waterRatio}</td>
        </tr>
        <tr>
            <td>İnce Agrega (Kum)</td>
            <td>${results.fa} kg</td>
            <td>${faRatio}</td>
        </tr>
        <tr>
            <td>İri Agrega (Çakıl)</td>
            <td>${results.ca} kg</td>
            <td>${caRatio}</td>
        </tr>
        <tr style="background-color: rgba(102, 252, 241, 0.15); border-top: 2px solid #66fcf1;">
            <td><strong>TOPLAM</strong></td>
            <td><strong>${results.total} kg/m³</strong></td>
            <td></td>
        </tr>
    `;
    
    updateChart(results);
}

function updateChart(results) {
    const ctx = document.getElementById('mixChart').getContext('2d');
    const data = [results.cement, results.water, results.fa, results.ca];
    
    if (mixChart) {
        mixChart.data.datasets[0].data = data;
        mixChart.update();
    } else {
        mixChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Çimento', 'Su', 'İnce Agrega (Kum)', 'İri Agrega (Çakıl)'],
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#c5c6c7', // Çimento
                        '#45a29e', // Su
                        '#eadcb3', // İnce Agrega
                        '#5b5c61'  // İri Agrega
                    ],
                    borderColor: '#1f2128',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#c5c6c7', font: { family: 'Inter' } }
                    }
                }
            }
        });
    }
}

// Tüm input'lara anlık değişim dinleyicisi ekle (GERÇEK ZAMANLI HESAPLAMA)
document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', calculateMix);
    el.addEventListener('input', calculateMix);
});

// İlk hesabı tetikle
calculateMix();

// Servis Çalışanı (PWA) Kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(reg => {
            console.log('PWA Service Worker Basariyla Kaydedildi.', reg);
        }).catch(err => {
            console.log('Service worker kaydi basarisiz.', err);
        });
    });
}
