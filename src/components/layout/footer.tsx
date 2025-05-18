
import { Facebook, Mail, Github, Linkedin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import NewsletterForm from '@/components/landing/newsletter-form';

export default function Footer() {
  return (
    <footer className="py-12 border-t bg-card text-card-foreground mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Newsletter Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Stay Connected</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest updates from MathVerse directly to your inbox.
            </p>
            <NewsletterForm variant="inline" />
          </div>

          {/* Contact Us Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Contact Us</h3>
            <p className="text-sm text-muted-foreground">
              Have questions or feedback? We&apos;d love to hear from you.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-5 w-5 text-accent" />
              <a href="mailto:support@mathverse.app" className="hover:underline hover:text-primary transition-colors">
                support@mathverse.app
              </a>
            </div>
             <div className="flex items-center space-x-2 text-sm">
              <MessageCircle className="h-5 w-5 text-accent" />
              <p>Live chat coming soon!</p>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Follow Us</h3>
            <p className="text-sm text-muted-foreground">
              Join our community on social media.
            </p>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="mailto:info@mathverse.app" aria-label="Email" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="GitHub" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Designed by Eavy &copy; {new Date().getFullYear()} MathVerse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
