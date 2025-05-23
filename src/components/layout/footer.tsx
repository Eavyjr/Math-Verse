
import Link from 'next/link';
import { Facebook, Mail, Github, Linkedin } from 'lucide-react';
import NewsletterForm from '@/components/landing/newsletter-form';

export default function Footer() {
  return (
    <footer className="py-12 border-t bg-card text-card-foreground mt-auto">
      <div className="container mx-auto px-4 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {/* Newsletter Subscription */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-lg font-semibold text-primary">Stay Connected</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest updates, new features, and mathematical insights delivered to your inbox.
            </p>
            <NewsletterForm variant="inline" />
          </div>

          {/* Contact Us & Quick Links (Example) */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">Get In Touch</h3>
             <p className="text-sm text-muted-foreground">
              Have questions or feedback? We&apos;d love to hear from you.
            </p>
            <Link href="mailto:support@mathverse.app" className="flex items-center gap-2 text-sm hover:text-accent transition-colors">
              <Mail className="h-4 w-4" /> support@mathverse.app
            </Link>
            {/* Add other quick links if needed */}
          </div>
          
          {/* Social Media Links */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">Follow Us</h3>
            <div className="flex space-x-4">
              <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-accent transition-colors">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-accent transition-colors">
                <Github className="h-6 w-6" />
              </Link>
              <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-accent transition-colors">
                <Linkedin className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MathVerse. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Designed by Eavy
          </p>
        </div>
      </div>
    </footer>
  );
}
