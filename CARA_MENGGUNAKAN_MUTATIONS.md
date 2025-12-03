# 🚀 Cara Menggunakan GraphQL Mutations

## ✅ Autentikasi Sudah Berhasil!

Jika Anda melihat error seperti:
- `"Planet 'Mustafar' sudah ada."`
- `"Karakter 'Obi-Wan Kenobi' sudah ada."`
- `"Kapal 'Imperial Star Destroyer' sudah ada."`

**Ini berarti autentikasi sudah bekerja dengan benar!** ✅

Error ini muncul karena data yang ingin dibuat sudah ada di database (UNIQUE constraint).

---

## 🔍 Solusi: Cek Data yang Sudah Ada

### Step 1: Query Data yang Sudah Ada

Sebelum membuat data baru, cek dulu apa yang sudah ada:

```graphql
query {
  allPlanets {
    id
    name
    climate
    terrain
  }
  
  allCharacters {
    id
    name
    species
  }
  
  allStarships {
    id
    name
    model
    manufacturer
  }
}
```

### Step 2: Pilih Salah Satu Opsi

#### Opsi A: Gunakan Nama yang Berbeda

```graphql
mutation {
  createPlanet(input: {
    name: "Mustafar II"  # Nama berbeda
    climate: "Hot"
    terrain: "Volcanic"
  }) {
    id
    name
  }
  
  createCharacter(input: {
    name: "Obi-Wan Kenobi (Clone)"  # Nama berbeda
    species: "Human"
    homePlanetId: 1
  }) {
    id
    name
  }
  
  createStarship(input: {
    name: "Imperial Star Destroyer Mark II"  # Nama berbeda
    model: "Imperial I-class"
    manufacturer: "Kuat Drive Yards"
  }) {
    id
    name
  }
}
```

#### Opsi B: Update Data yang Sudah Ada

Jika ingin mengubah data yang sudah ada:

```graphql
mutation {
  updatePlanet(input: {
    id: 1  # ID planet yang sudah ada
    name: "Mustafar Updated"
    climate: "Very Hot"
    terrain: "Lava Fields"
  }) {
    id
    name
    climate
    terrain
  }
}
```

#### Opsi C: Hapus Data yang Sudah Ada (Admin Only)

Jika Anda admin dan ingin menghapus data lama:

```graphql
mutation {
  deletePlanet(id: 1) {
    id
    name
  }
}
```

Lalu buat data baru:

```graphql
mutation {
  createPlanet(input: {
    name: "Mustafar"
    climate: "Hot"
    terrain: "Volcanic"
  }) {
    id
    name
  }
}
```

---

## 📝 Contoh Lengkap: Create dengan Nama Baru

```graphql
mutation {
  # Planet baru dengan nama unik
  createPlanet(input: {
    name: "Coruscant"
    climate: "Temperate"
    terrain: "Urban"
  }) {
    id
    name
    climate
    terrain
  }
  
  # Character baru dengan nama unik
  createCharacter(input: {
    name: "Anakin Skywalker"
    species: "Human"
    homePlanetId: 1
  }) {
    id
    name
    species
  }
  
  # Starship baru dengan nama unik
  createStarship(input: {
    name: "Millennium Falcon"
    model: "YT-1300"
    manufacturer: "Corellian Engineering Corporation"
  }) {
    id
    name
    model
    manufacturer
  }
}
```

---

## 🎯 Tips

1. **Selalu query dulu** sebelum create untuk melihat data yang sudah ada
2. **Gunakan nama yang unik** untuk data baru
3. **Gunakan update** jika ingin mengubah data yang sudah ada
4. **Gunakan delete** (admin only) jika ingin menghapus dan membuat ulang

---

## ✅ Checklist

- [ ] ✅ Autentikasi sudah bekerja (tidak ada error "Authentication required")
- [ ] ✅ Query data yang sudah ada terlebih dahulu
- [ ] ✅ Gunakan nama yang unik atau update data yang sudah ada
- [ ] ✅ Pastikan format mutation sudah benar

---

**May the Force be with you!** ⚔️✨

