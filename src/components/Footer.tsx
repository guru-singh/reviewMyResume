import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t mt-12 py-6 text-center text-sm text-gray-600">
            <div className="flex justify-center gap-6">
                <Link href="/privacy" className="hover:underline">
                    Privacy Policy
                </Link>

                <Link href="/terms" className="hover:underline">
                    Terms
                </Link>

                <Link href="/pricing" className="hover:underline">
                    Pricing
                </Link>
                <Link href="/refund" className="hover:underline">
                    Refund Policy
                </Link>
            </div>

            <p className="mt-4">
                © {new Date().getFullYear()} ReviewMyResume
            </p>
        </footer>
    );
}