import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="absolute top-4 right-4 p-2 rounded-full text-muted hover:text-white hover:bg-white/10 transition-colors z-50"
      title="Switch Language (中/En)"
    >
      <Languages size={20} />
    </button>
  );
}
