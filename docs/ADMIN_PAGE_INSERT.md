# Innkobling på `app/admin/system/mariadb-neon/page.tsx`

Legg til import øverst i eksisterende sidefil:

```tsx
import NeonRuleEstablishmentPanel from "@/components/admin/system/NeonRuleEstablishmentPanel";
```

Plasser komponenten i admin-siden under Dashboard / Tiltak eller rett før eksisterende Svar til ChatGPT-seksjon:

```tsx
<NeonRuleEstablishmentPanel />
```

Dette gir punkt 4 og 5:

- Vise resultat på `/admin/system/mariadb-neon`
- Legge til eget `Svar til ChatGPT`-felt

Ikke fjern eksisterende admin/system-innhold. Dette er et nytt panel, ikke en erstatning av siden.
