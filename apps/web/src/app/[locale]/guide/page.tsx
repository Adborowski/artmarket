import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Przewodnik bezpiecznej sprzedaży — Artmarket',
  description: 'Jak działa ochrona artystów i kupujących na Artmarket. System depozytowy, śledzenie przesyłek i rozwiązywanie sporów.',
}

export default async function GuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Artmarket</p>
        <h1 className="mt-2 text-4xl">Przewodnik bezpiecznej sprzedaży</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Sprzedaż oryginalnych dzieł sztuki online wymaga wzajemnego zaufania. Ten przewodnik wyjaśnia, jak Artmarket chroni zarówno artystów, jak i kupujących — od momentu złożenia pierwszej oferty do chwili, gdy praca trafia na właściwą ścianę.
        </p>
      </div>

      <hr className="mb-10" />

      {/* For Artists */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl">Dla artystów</h2>

        <div className="space-y-8">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Twoje pieniądze są zabezpieczone zanim wyślesz pracę</h3>
            <p className="text-muted-foreground leading-relaxed">
              Gdy aukcja się kończy i kupujący wygrywa, środki są natychmiast pobierane z jego karty i trafiają na rachunek depozytowy — nie do Artmarket, lecz do zabezpieczonego rachunku obsługiwanego przez Stripe. Zanim wyślesz pracę, wiesz, że pieniądze już czekają. Nie ma ryzyka, że kupujący zniknie po licytacji.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Wysyłaj z numerem śledzenia — zawsze</h3>
            <p className="text-muted-foreground leading-relaxed">
              Gdy praca jest gotowa do wysyłki, wprowadzasz numer listu przewozowego w systemie. To kluczowy krok: od tego momentu to firma kurierska — nie kupujący — jest stroną potwierdzającą dostarczenie. Jeśli kurier odnotuje doręczenie, a kupujący twierdzi, że paczka nie dotarła, dysponujesz dowodem wystawionym przez niezależną stronę trzecią.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Przy wartościowych pracach — wymagaj podpisu przy odbiorze</h3>
            <p className="text-muted-foreground leading-relaxed">
              Dla przesyłek o wartości powyżej 1 000 PLN zalecamy wybór opcji dostawy z potwierdzeniem podpisu. Podpis odbiorcy przy dostarczeniu jest praktycznie niepodważalnym dowodem. Wielu kupujących docenia tę dodatkową formalność — świadczy ona o tym, że praca jest traktowana poważnie.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Dokumentuj pakowanie</h3>
            <p className="text-muted-foreground leading-relaxed">
              Zrób kilka zdjęć przed nadaniem przesyłki: pracy leżącej na stole pakowania, gotowej paczki, a najlepiej też etykiety adresowej. Zdjęcia te możesz załączyć do zamówienia na platformie. Stanowią one dowód stanu pracy w momencie wysyłki — chronią cię zarówno przed fałszywymi roszczeniami o uszkodzenie, jak i przed ewentualnymi sporami dotyczącymi zawartości.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Kiedy otrzymujesz pieniądze</h3>
            <p className="text-muted-foreground leading-relaxed">
              Po potwierdzeniu dostarczenia przez kuriera kupujący ma 7 dni na zgłoszenie ewentualnego sporu. Jeśli w tym czasie żaden spór nie zostanie otwarty, środki są automatycznie przekazywane na twoje konto, pomniejszone o prowizję Artmarket. Nie musisz o nic prosić ani niczego potwierdzać — system działa automatycznie.
            </p>
          </div>
        </div>
      </section>

      <hr className="mb-10" />

      {/* For Buyers */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl">Dla kupujących</h2>

        <div className="space-y-8">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Twoje pieniądze są bezpieczne do momentu potwierdzenia dostawy</h3>
            <p className="text-muted-foreground leading-relaxed">
              Gdy wygrywasz aukcję, środki trafiają na rachunek depozytowy — artysta nie otrzymuje ich od razu. Pieniądze zostają zwolnione dopiero po potwierdzeniu dostarczenia przesyłki i upływie 7-dniowego okresu na zgłoszenie sporu. Jeśli coś pójdzie nie tak, masz czas i narzędzia, żeby to zgłosić.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Jak zgłosić problem z przesyłką</h3>
            <p className="text-muted-foreground leading-relaxed">
              Jeśli paczka nie dotarła lub praca jest uszkodzona, otwórz spór w ciągu 7 dni od odnotowania dostawy przez kuriera. W panelu zamówienia znajdziesz przycisk „Zgłoś problem". Opisz sytuację i — jeśli to możliwe — załącz zdjęcia. Nasz zespół skontaktuje się z tobą w ciągu 48 godzin.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Co się dzieje podczas sporu</h3>
            <p className="text-muted-foreground leading-relaxed">
              Środki pozostają zablokowane na rachunku depozytowym przez cały czas trwania sporu — żadna ze stron nie ma do nich dostępu. Artmarket bada sprawę, weryfikując dane śledzenia przesyłki, zdjęcia z pakowania i korespondencję między stronami. Decyzja jest oparta na faktach, nie na samych oświadczeniach.
            </p>
          </div>
        </div>
      </section>

      <hr className="mb-10" />

      {/* How disputes work */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl">Jak rozstrzygamy spory</h2>
        <p className="mb-6 text-muted-foreground leading-relaxed">
          Gdy spór zostaje otwarty, nasz zespół analizuje dostępne dowody w określonej kolejności:
        </p>
        <ol className="space-y-4">
          {[
            ['Dane śledzenia przesyłki', 'Sprawdzamy status dostawy bezpośrednio w systemie firmy kurierskiej. Potwierdzenie dostarczenia z podpisem jest najsilniejszym dostępnym dowodem.'],
            ['Zdjęcia z pakowania', 'Weryfikujemy dokumentację fotograficzną przesłaną przez artystę w momencie nadania paczki.'],
            ['Historia transakcji na platformie', 'Bierzemy pod uwagę historię kupującego i artysty — liczba wcześniejszych transakcji, ewentualne wcześniejsze spory.'],
            ['Bezpośrednia komunikacja', 'Analizujemy korespondencję między stronami prowadzoną przez wewnętrzny system wiadomości.'],
            ['Decyzja i realizacja', 'Na podstawie zebranych dowodów podejmujemy decyzję: zwolnienie środków do artysty, zwrot do kupującego lub rozwiązanie pośrednie. Strony są informowane o uzasadnieniu decyzji.'],
          ].map(([title, desc], i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <hr className="mb-10" />

      {/* Commitment */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl">Nasze zobowiązanie</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Artmarket powstał z myślą o artystach. Wierzymy, że tworzenie sztuki to ciężka praca, która zasługuje na uczciwe wynagrodzenie i ochronę przed nadużyciami. Dlatego każdy element systemu — od wymogu karty przed licytacją, przez rachunek depozytowy, po śledzenie przesyłek — jest zaprojektowany tak, żeby artysta nigdy nie musiał wysyłać pracy i czekać w niepewności.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Jeśli masz pytania dotyczące bezpieczeństwa transakcji lub chcesz zgłosić problem, skontaktuj się z nami przez panel sporu lub napisz bezpośrednio na adres podany w stopce.
        </p>
      </section>
    </main>
  )
}
