import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES } from "@/i18n";

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    // Set dir attribute for RTL languages
    const lang = LANGUAGES.find((l) => l.code === code);
    document.documentElement.dir = lang?.dir === "rtl" ? "rtl" : "ltr";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t("settings.language")}
        </CardTitle>
        <CardDescription>{t("settings.languageDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label>{t("settings.language")}</Label>
          <Select value={i18n.language?.split("-")[0] || "en"} onValueChange={handleChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
