import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InstallApp from '@/components/InstallApp';
export default function Install() {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[80vh] max-w-2xl px-5 pb-16 pt-32">
        <h1 className="mb-6 text-3xl font-black">Instala Polaris</h1>
        <InstallApp />
      </main>
      <Footer />
    </>
  );
}
