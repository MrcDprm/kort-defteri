# Bildirim sesi: tenis ralli sesi, kodla sentezlenir, telif gerektirmez.
# Kullanım: python scripts/vurus-sesi.py assets/sounds/vurus.wav
# Telefon hoparlörünün iyi verdiği 600 Hz - 4 kHz aralığına yoğunlaşır: dört vuruş, aralarda sekme.
import sys, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(11)
N = int(SR * 2.6)
t = np.arange(N) / SR

def sonumlu(f, tau, genlik, bas, kayma=0.0):
    tt = t - bas
    y = np.zeros(N)
    m = tt >= 0
    x = tt[m]
    atak = 1 - np.exp(-x / 0.0004)  # tık olmasın diye çok kısa yükseliş
    y[m] = genlik * atak * np.sin(2 * np.pi * (f * x - 0.5 * kayma * x * x)) * np.exp(-x / tau)
    return y

def tik(tau, genlik, bas):
    n = np.diff(rng.standard_normal(N), prepend=0)
    n = n - np.convolve(n, np.ones(3) / 3, mode='same')  # yalnızca tiz kısım
    tt = t - bas
    y = np.where(tt >= 0, genlik * n * np.exp(-np.clip(tt, 0, None) / tau), 0)
    return y

def vurus(bas, ton=1.0, guc=1.0):
    return guc * (
        tik(0.0025, 0.5, bas)
        + sonumlu(1250 * ton, 0.06, 1.0, bas, kayma=2500)   # topun pok sesi
        + sonumlu(2650 * ton, 0.018, 0.45, bas)              # parlaklık
        + sonumlu(640 * ton, 0.13, 0.6, bas)               # kordaj çınlaması
        + sonumlu(1900 * ton, 0.045, 0.25, bas)
    )

def sekme(bas):
    return 0.5 * (tik(0.004, 0.25, bas) + sonumlu(900, 0.02, 0.8, bas, kayma=4000) + sonumlu(1500, 0.012, 0.3, bas))

y = sum(vurus(0.7 * i, ton=(1.0 if i % 2 == 0 else 0.92)) + sekme(0.7 * i + 0.34) for i in range(3)) + vurus(2.1, ton=1.0)
y = np.tanh(2.2 * y / np.max(np.abs(y)))  # yumuşak sıkıştırma: algılanan ses yükselir
son = int(SR * 0.06)
y[-son:] *= np.linspace(1, 0, son)
y = y / np.max(np.abs(y)) * 0.95

with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((y * 32767).astype('<i2').tobytes())

for a in range(0, N, int(SR * 0.05)):
    s = y[a:a + int(SR * 0.05)]
    print(round(a / SR, 2), round(float(np.sqrt((s ** 2).mean())), 3))
print('rms', round(float(np.sqrt((y ** 2).mean())), 3))
