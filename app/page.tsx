"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  Users,
  Star,
  Shield,
  Zap,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  MessageSquare,
  Award,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Play,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Menu,
  X,
  Mail,
  Send,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { value: "10k+", label: "Active Workers", icon: Users },
    { value: "5k+", label: "Jobs Completed", icon: CheckCircle },
    { value: "4.8", label: "Average Rating", icon: Star },
    { value: "98%", label: "Satisfaction", icon: TrendingUp },
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure Payments",
      description:
        "Your money is held securely until the job is done to your satisfaction",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      icon: Zap,
      title: "Quick Matching",
      description:
        "AI-powered matching finds the perfect professional for your job in minutes",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      icon: Star,
      title: "Verified Reviews",
      description:
        "Real feedback from real people with verified job completion",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock customer support to help you anytime",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Post a Job",
      description:
        "Describe what you need done, set your budget, and choose your timeline",
      icon: Briefcase,
      color: "from-blue-500 to-cyan-500",
    },
    {
      step: "02",
      title: "Get Offers",
      description:
        "Receive proposals from qualified workers with reviews and ratings",
      icon: Users,
      color: "from-purple-500 to-pink-500",
    },
    {
      step: "03",
      title: "Choose & Chat",
      description: "Message candidates, ask questions, and pick the best fit",
      icon: MessageSquare,
      color: "from-yellow-500 to-orange-500",
    },
    {
      step: "04",
      title: "Get It Done",
      description: "Work gets completed, you approve, and payment is released",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Homeowner",
      content:
        "Found an amazing plumber in under 2 hours. Fixed my leaking pipe perfectly!",
      rating: 5,
      avatar: "S",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Michael Chen",
      role: "Electrician",
      content:
        "Hustle has transformed my business. I get consistent work and fair pay every time.",
      rating: 5,
      avatar: "M",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Emily Rodriguez",
      role: "Interior Designer",
      content:
        "The platform is so easy to use. Found three new clients in my first week!",
      rating: 5,
      avatar: "E",
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const categories = [
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Moving",
    "Gardening",
    "Painting",
    "Tutoring",
    "Delivery",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-md shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10  rounded-xl flex items-center justify-center">
                <img src="/logo.svg" alt="" />{" "}
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HUSTLE
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-gray-700 hover:text-gray-900 transition"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-gray-700 hover:text-gray-900 transition"
              >
                How it Works
              </Link>
              <Link
                href="#testimonials"
                className="text-gray-700 hover:text-gray-900 transition"
              >
                Testimonials
              </Link>
              <Link
                href="#pricing"
                className="text-gray-700 hover:text-gray-900 transition"
              >
                Pricing
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 px-4 py-2 transition"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Sign up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link
                href="#features"
                className="block text-gray-700 hover:text-gray-900 py-2"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="block text-gray-700 hover:text-gray-900 py-2"
              >
                How it Works
              </Link>
              <Link
                href="#testimonials"
                className="block text-gray-700 hover:text-gray-900 py-2"
              >
                Testimonials
              </Link>
              <Link
                href="#pricing"
                className="block text-gray-700 hover:text-gray-900 py-2"
              >
                Pricing
              </Link>
              <div className="pt-4 border-t border-gray-100 flex gap-4">
                <Link
                  href="/login"
                  className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="pt-0">
              <h1 className="text-5xl md:text-5xl font-bold mb-6 leading-tight">
                Connect with{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Top Talent
                </span>
                <br />
                or Find Your{" "}
                <span className="bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Next Gig{" "}
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                The smart platform that connects skilled workers with people who
                need their services. Fast, secure, and reliable.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/signup?role=worker"
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-5 h-5" />
                  I'm a Worker
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
                <Link
                  href="/signup?role=customer"
                  className="group bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  I Need a Service
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                        <Icon className="w-4 h-4 text-blue-500" />
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Content - Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-6 h-6 ${feature.textColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-12 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Get your job done in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative group">
                  {/* Connector Line */}
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-200 to-purple-200" />
                  )}

                  <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div
                      className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                    >
                      {index + 1}
                    </div>

                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-12 bg-white">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Categories
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Find professionals in your area
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/jobs?category=${category.toLowerCase()}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-6 hover:shadow-xl transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {category}
                </h3>
                <p className="text-sm text-gray-500 mt-1">120+ jobs</p>
                <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Mail className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">Stay Updated</h2>
            <p className="text-xl text-white/90 mb-8">
              Subscribe to our newsletter for the latest jobs, tips, and
              exclusive offers
            </p>

            <form className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:border-white/40 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send />
                </button>
              </div>
              <p className="text-sm text-white/70 mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </div>
        </div>
      </section>
      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-12 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Users Say
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-r ${testimonial.color} flex items-center justify-center text-white font-bold text-lg`}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-600">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />

        <div className="container mx-auto relative z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and workers today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all transform hover:scale-105 inline-flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10  rounded-xl flex items-center justify-center">
                  <img src="/logo.svg" alt="" />{" "}
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  HUSTLE
                </span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                Connecting talented professionals with people who need their
                services. Fast, secure, and reliable.
              </p>
              <div className="flex space-x-4">
                {[Twitter, Instagram, Linkedin, Github].map((Icon, index) => (
                  <Link
                    key={index}
                    href="#"
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition group"
                  >
                    <Icon className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                  </Link>
                ))}
              </div>
            </div>

            {/* For Workers */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">For Workers</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/worker/register"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Become a Worker
                  </Link>
                </li>
                <li>
                  <Link
                    href="/worker/guide"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Worker Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="/worker/faq"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/worker/success"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Success Stories
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Customers */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                For Customers
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/customer/guide"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    How to Post a Job
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer/faq"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Customer FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer/safety"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Safety Tips
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer/trust"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Trust & Safety
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/compliance"
                    className="text-gray-600 hover:text-blue-600 transition"
                  >
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 HUSTLE. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Terms
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
