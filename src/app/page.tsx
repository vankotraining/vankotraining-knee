import ButtonGuards from "./components/ButtonGuards";
import ClientDeletion from "./components/ClientDeletion";
import KneeDashboard from "./components/KneeDashboard";

export default function Home() {
  return (
    <>
      <KneeDashboard />
      <ClientDeletion />
      <ButtonGuards />
    </>
  );
}
