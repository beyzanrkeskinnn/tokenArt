🎯 **TokenArt Balance Debugging Guide - 22 Haziran 2025**

## Şu Anda Test Edilecek Adımlar:

### 1. **Freighter Wallet Setup**
```
✅ Freighter extension yüklü olmalı
✅ Testnet ağına geçiş yapılmalı  
✅ Aktif bir testnet hesabı olmalı
```

### 2. **Test Adımları**
1. http://localhost:3006 açın
2. Browser Console'u açın (F12)
3. Freighter'a bağlanın
4. Console'da şu komutları test edin:

```javascript
// 1. Basit balance testi
simpleBalanceTest("YOUR_STELLAR_ADDRESS")

// 2. Current address al
TokenArtDebug.getCurrentAddress()

// 3. Full wallet test
TokenArtDebug.quickTest()

// 4. Eğer balance 0 ise, fund et
fundAccount("YOUR_STELLAR_ADDRESS")
```

### 3. **Debugging Console Commands**

**Wallet Info:**
```javascript
// Aktif cüzdan adresini al
TokenArtDebug.getCurrentAddress()

// Balance test yap  
TokenArtDebug.testBalance("ADDRESS")

// Tam test akışı
TokenArtDebug.fullWalletTest()
```

**Manuel API Testi:**
```javascript
// Doğrudan API çağrısı
simpleBalanceTest("GABCD...XYZ")

// Account funding
fundAccount("GABCD...XYZ")
```

### 4. **Beklenen Sonuçlar**

**Başarılı Balance Fetch:**
```
✅ [SIMPLE TEST] SUCCESS: 10000.0000000 XLM found!
💰 [BALANCE] Native XLM balance found: 10000.0000000
```

**Account Not Found:**
```
🔍 [SIMPLE TEST] Account not found (404) - needs funding
💡 [SIMPLE TEST] Fund account at: https://friendbot.stellar.org
```

### 5. **Sorun Giderme**

**Problem: Balance 0 gösteriyor**
```javascript
// 1. Address doğru mu kontrol et
console.log(localStorage.getItem('public_key'))

// 2. Manuel API test
simpleBalanceTest(localStorage.getItem('public_key'))

// 3. Friendbot ile fund et
fundAccount(localStorage.getItem('public_key'))
```

**Problem: Network hatası**
```javascript
// Connectivity test
TokenArtDebug.testNetwork()
```

### 6. **Manual Testing Flow**

1. **Freighter Connect** → Console'da adres görünmeli
2. **Balance Test** → `simpleBalanceTest(address)` 
3. **Fund Account** → `fundAccount(address)` (eğer 0 ise)
4. **Retry Balance** → 3 saniye sonra tekrar test
5. **UI Refresh** → Refresh butonuna bas

Bu adımları takip ederek gerçek testnet balance'ının çekilip çekilmediğini test edebiliriz.
