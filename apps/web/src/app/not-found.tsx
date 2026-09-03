import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-3xl mb-4 font-bold shadow-sm">
        🚩
      </div>
      <h2 className="text-2xl font-extrabold text-[#292118] mb-2">पृष्ठ सापडले नाही (404)</h2>
      <p className="text-sm text-[#6B6459] max-w-sm mb-6">
        तुम्ही शोधत असलेले पृष्ठ उपलब्ध नाही किंवा हलवले गेले आहे.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-[#F97316] text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition"
      >
        मुख्य पृष्ठावर जा
      </Link>
    </div>
  );
}
