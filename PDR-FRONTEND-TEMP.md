# 🎨 Frontend Özelleştirme PDR Template


## 📋 **Proje Bilgileri**

### **Seçilen Sektör**: Art & Investment (Sanat & Yatırım)
### **Platform Adı**: [TokenArt]
### **Ana Varlık Türü**: Physical Artworks (Physical Paintings divided into investment shares)
### **Hedef Kitle**: Küçük ve orta ölçekli sanat yatırımcıları, Sanat koleksiyonerleri, Sanatçılar (eserlerini daha geniş kitleye açmak isteyenler), Alternatif yatırım aracı arayan bireyler

---

## 🎯 **Platform Vizyonu**

### **Ana Konsept**
Sanatçılar tarafından yüklenen fiziksel tablolar, blockchain üzerinde tokenize edilir ancak NFT kullanılmaz. Tablolar, yatırım paylarına bölünerek birden fazla yatırımcıya satılır. Tüm paylar satıldığında fiziksel eser satılır veya açık artırmaya çıkarılır ve elde edilen kar, pay sahiplerine oranlı olarak dağıtılır. Platform, blockchain’in güvenilirlik ve şeffaflığını kullanırken, NFT karmaşasını ortadan kaldırarak daha erişilebilir ve anlaşılır bir yatırım deneyimi sunar

### **Değer Önerisi**
- **[Sanatçılar:] için**: [Eserin tamamını satmadan finansmana erişim; daha geniş bir yatırımcı kitlesine ulaşma imkanı.]
- **[Yatırımcılar] için**: [Gerçek, fiziksel sanat eserlerine küçük paylarla yatırım yapma fırsatı; şeffaf sahiplik ve kâr paylaşımı.]
- **[Koleksiyonerler] için**: Parçalı sahipliğe erişim; koleksiyonlarını ve yatırımlarını çeşitlendirme olanağı.
- **[Platform] için**: Sanat piyasasının ihtiyaçlarına uygun, basit ve NFT kullanılmayan parçalı yatırım platformu.
---

## 🎨 **Görsel Kimlik Güncellemeleri**

### **Renk Paleti**
```css
--primary: #6B4C9A      /* Mor tonları - Sanatın derinliği ve yaratıcılık */
--secondary: #E0B0FF    /* Açık lavanta - Yumuşak ve yatırım dostu */
--accent: #FFD700       /* Altın sarısı - Değer ve prestij hissi */
--background: #F9F6FF   /* Çok açık mor - Ferah ve sade arka plan */
--foreground: #3B2C6F   /* Koyu mor-mavi - Okunabilir metin */

```


### **İkonlar ve Emojiler**
- **Ana Tema**: 🎨 🖼️ 💰 🤝 🖌️ 🏛️
- **Alt Kategoriler**: [🖼️ 🎭 🖌️ 🖥️ 📸 🏺]
- **İşlemler**: [🛒 💸 📊 📝 🔄 ✅]

### **Tipografi**
- **Başlıklar**: [Poppins]
- **İçerik**: [Open Sans]
- **Ton**: Sıcak, güvenilir, profesyonel

---

## 📁 **Güncellenmesi Gereken Dosyalar**

### **🏠 Ana Sayfa (`app/page.tsx`)**

#### **Başlık ve Açıklama**
```typescript
title: "[TokenArt]" 
description: "Invest fractionally in physical artworks without NFTs — buy shares, share profits, support artists." 
```

#### **Dashboard Kartları**
```typescript

"Portfolio Değeri" → "[Art Investment Value]"
"Toplam Yatırım" → "[Total Shares Purchased]" 
"Aktif Varlıklar" → "[Active Artworks]"
"Compliance Status" → "[Authenticity Verification]"

```
### Wallet Bağlantısı

* **Freighter Wallet API** entegrasyonu
* Basit connect/disconnect işlemleri
* FreighterWalletDocs.md dosyasına bakarak bu dökümandaki bilgilerle ilerlemeni istiyorum 

### Frontend Geliştirme

* Basic ve modern görünümlü bir frontend geliştireceğiz
* Karmaşık yapısı olmayacak


### Smart Contract Geliştirme

* Tek amaçlı, basit contract yazılacak
* Maksimum 3-4 fonksiyon içerecek
* Temel blockchain işlemleri (read/write)
* Minimal veri saklama
* Kolay test edilebilir fonksiyonlar

### Frontend Entegrasyonu

* Mevcut frontend'e müdahale edilmeyecek
* Sadece **JavaScript entegrasyon kodları** eklenecek
* Contract fonksiyonları frontend'e bağlanacak

#### **Hızlı Eylemler**
```typescript

"Discover Assets" → "[Explore Artworks]"
"Token Transfer" → "Share Transfer"
"Tokenize" → "List Artwork"


```

### **🏪 Marketplace (`app/marketplace/page.tsx`)**

#### **Arama ve Filtreler**
```typescript

asset_type: ["painting", "sculpture", "photography", "digital"]
location: ["Istanbul", "Ankara", "Izmir", "Online"]
category: ["modern", "classic", "contemporary", "abstract"]
certification: ["authentic", "limited edition", "signed"]


```

#### **Varlık Kartları**
```typescript
{
  name: "Sunset Over Bosphorus",
  symbol: "SOB01",
  creator: "Ayşe Demir - Istanbul",
  date: "Created: 2020",
  specs: "Oil on canvas, 70x90 cm",
  price_per_token: "200 TRY",
  total_supply: 100,
  sold_percentage: 75
}

```

#### **Metrikler**
```typescript
"Total Collection Value" → "Total Art Collection Value"
"Active Investors" → "Active Investors"
"Completed Sales" → "Artworks Sold"

```

### **🌱 Tokenization (`app/tokenize/page.tsx`)**

#### **5 Adımlı Süreç**
```typescript

11. "Basic Information" → "Artwork Details"
   - Type, dimensions, medium
   
2. "Artwork Details" → "Artist & History"
   - Artist bio, creation date, provenance
   
3. "Legal Documents" → "Authenticity & Ownership"
   - Certificates, ownership papers
   
4. "Token Economics" → "Investment Terms"
   - Share price, total shares, profit distribution
   
5. "Publishing" → "List Artwork"
   - Final review and publish


```

### **💸 Transfer (`app/transfer/page.tsx`)**

#### **Transfer Terminolojisi**
```typescript
"Token Transfer" → "Share Transfer"
"Recipient Address" → "Investor ID"
"Transfer Amount" → "Share Quantity"
"Compliance Check" → "Ownership Verification"



### **🎨 Layout (`app/layout.tsx`)**

#### **Metadata**
```typescript

export const metadata = {
  title: 'ArtPieceShares - Fractional Investment in Physical Artworks',
  description: 'Easily invest in physical artworks through fractional shares without blockchain complexity.',
  icons: {
    icon: '/artpiecefavicon.ico',
  }
}

```

### **📱 Header (`components/layout/Header.tsx`)**

#### **Navigasyon Menüsü**
```typescript
"Dashboard" → "My Portfolio"
"Tokenize" → "List Artwork"
"Transfer" → "Share Transfer"
"Support" → "Help Center" 

```

---

## 🔧 **Teknik Güncellemeler**

### **Type Definitions (`lib/types.ts`)**

```typescript

export interface ArtAsset {
  id: string;
  name: string;
  symbol: string;
  asset_type: 'painting' | 'sculpture' | 'photography' | 'digital';
  creator_info: {
    name: string;
    location: string;
    experience_years: number;
    certifications: string[];
  };
  asset_details: {
    dimensions: string;
    medium: string;
    provenance: string;
    authenticity_certified: boolean;
  };
  timeline_info: {
    creation_date: string;
    exhibition_date: string;
    estimated_sale_date: string;
    quality_grade: 'A' | 'B' | 'C';
  };
  financial: {
    funding_goal: number;
    current_funding: number;
    share_price: number;
    total_shares: number;
  };
}


```

### **Mock Data (`lib/contract.ts`)**

```typescript
const SAMPLE_ART = [
  {
    id: 'art-001',
    name: 'Sunset Over Bosphorus',
    symbol: 'SOB01',
    asset_type: 'painting',
    creator_info: {
      name: 'Ayşe Demir',
      location: 'Istanbul',
      experience_years: 15,
      certifications: ['Authenticity Certificate', 'Gallery Exhibit']
    },
    asset_details: {
      dimensions: '70x90 cm',
      medium: 'Oil on Canvas',
      provenance: 'Private Collection',
      authenticity_certified: true
    },
    timeline_info: {
      creation_date: '2020-05-10',
      exhibition_date: '2021-06-15',
      estimated_sale_date: '2025-12-31',
      quality_grade: 'A'
    },
    financial: {
      funding_goal: 20000,
      current_funding: 15000,
      share_price: 200,
      total_shares: 100
    }
  }
];



---

## 🎯 **Uygulama Özelleştirirken Agentın Dikkat Etmesini istediğimiz kısımlar**

### **Çiftçiler için UX**
- ✅ En basic ve bug çıkarmayacak şekilde projeyi özelleştir
- ✅ Yeni özellik ekleme sadece olan şeyleri pdr-frontend.md dosyasına ve verdiğim prompta uygun şekilde güncelle
- ✅ Uygulama Tamamen ingilizce olmalı
- ✅ Gereksiz yerleri güncellemene gerek yok sadece frontendde görünen kısımları güncelleyelim
- ✅ Rust kodlarını değiştirme sadece frontend kodları özelleştirilecek. <- ÖNEMLİ!
- ✅ Projeyi olabildiğince uzatmadan, basic ve hatasız şekilde geliştir

## 📝 **Implementasyon Checklist**

### **Phase 1: Temel Özelleştirme 
- [ ] Başlık ve açıklamaları güncelle
- [ ] Renk paletini değiştir
- [ ] İkonları ve emojiları adapte et
- [ ] Navigasyon menüsünü güncelle
- [ ] Mock data'yı sektöre uyarla

### **Phase 2: Gelişmiş İçerik 
- [ ] Dashboard widget'larını özelleştir
- [ ] Marketplace filtrelerini genişlet
- [ ] Type definitions'ları güncelle
- [ ] Tokenization flow'unu adapte et
- [ ] Transfer terminolojisini değiştir

---


<div align="center">

** 🚀 🚀 🎨 Bridging Art & Investment with Fractional Ownership! 🎨 🚀 **

*"Empowering everyone to invest in real art, share the value, and support creativity."*

</div>

---


