import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import Logo from "@/components/shared/logo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Footer() {
  const t = useTranslations("landing.footer");
  const currentYear = new Date().getFullYear();

  // Link item component with proper touch target size (≥50px on mobile)
  const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      className="block min-h-[50px] flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2 sm:py-1 sm:min-h-0"
    >
      {children}
    </Link>
  );

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-6 py-12">
        {/* Company Info - Always visible */}
        <div className="mb-8 sm:mb-0 sm:hidden">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("description")}
            </p>
            <div className="flex justify-center space-x-6">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors p-2"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors p-2"
                aria-label="Twitter"
              >
                <Twitter className="h-6 w-6" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors p-2"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile: Accordion sections */}
        <div className="sm:hidden">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="quick-links">
              <AccordionTrigger className="font-semibold">{t("quickLinks")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-2">
                  <FooterLink href="/facilities">{t("allFacilities")}</FooterLink>
                  <FooterLink href="/about">{t("aboutUs")}</FooterLink>
                  <FooterLink href="/contact">{t("contact")}</FooterLink>
                  <FooterLink href="/help">{t("helpCenter")}</FooterLink>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="providers">
              <AccordionTrigger className="font-semibold">{t("forProviders")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-2">
                  <FooterLink href="/providers/login">{t("providerLogin")}</FooterLink>
                  <FooterLink href="/provider/signup">{t("listYourFacility")}</FooterLink>
                  <FooterLink href="/pricing">{t("pricing")}</FooterLink>
                  <FooterLink href="/support">{t("support")}</FooterLink>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="contact">
              <AccordionTrigger className="font-semibold">{t("contactInfo")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <div className="flex items-center space-x-3 min-h-11">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Ljubljana, Slovenia</span>
                  </div>
                  <div className="flex items-center space-x-3 min-h-11">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">+386 1 234 5678</span>
                  </div>
                  <div className="flex items-center space-x-3 min-h-11">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">info@playmaker.si</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Tablet/Desktop: Grid layout */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              {t("description")}
            </p>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("quickLinks")}</h3>
            <div className="space-y-2">
              <FooterLink href="/facilities">{t("allFacilities")}</FooterLink>
              <FooterLink href="/about">{t("aboutUs")}</FooterLink>
              <FooterLink href="/contact">{t("contact")}</FooterLink>
              <FooterLink href="/help">{t("helpCenter")}</FooterLink>
            </div>
          </div>

          {/* For Providers */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("forProviders")}</h3>
            <div className="space-y-2">
              <FooterLink href="/providers/login">{t("providerLogin")}</FooterLink>
              <FooterLink href="/provider/signup">{t("listYourFacility")}</FooterLink>
              <FooterLink href="/pricing">{t("pricing")}</FooterLink>
              <FooterLink href="/support">{t("support")}</FooterLink>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("contactInfo")}</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Ljubljana, Slovenia
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  +386 1 234 5678
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  info@playmaker.si
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {t("rights")}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 flex items-center"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 flex items-center"
            >
              {t("terms")}
            </Link>
            <Link
              href="/cookies"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 flex items-center"
            >
              {t("cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
