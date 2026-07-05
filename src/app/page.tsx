const sections = [
  {
    title: "Guidance",
    text: "Postup rehabilitace kolene od edukace pres zatez az po navrat ke sportu.",
  },
  {
    title: "Testy",
    text: "Prostor pro mereni kvadricepsu, hamstringu, lytka, skoku a subjektivni toleranci zateze.",
  },
  {
    title: "Framework",
    text: "Rizeni rozhodnuti: kdy pridat zatez, kdy drzet objem a kdy ubrat.",
  },
];

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">knee.vankotraining.cz</p>
        <h1>Knee project</h1>
        <p className="lead">
          Samostatna aplikace pro koleno, rehabilitacni guidance a postupne
          budovani frameworku pro sportovce i klienty.
        </p>
      </section>

      <section className="grid" aria-label="Zakladni oblasti">
        {sections.map((section) => (
          <article className="card" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </article>
        ))}
      </section>

      <section className="status">
        <h2>Aktualni stav</h2>
        <p>
          Projekt je zalozeny oddelene od hlavniho webu a treninkove aplikace.
          Prvni verze drzi jen smer, hranice a misto pro dalsi iterace.
        </p>
      </section>
    </main>
  );
}
