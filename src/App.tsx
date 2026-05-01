/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  MapPin, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Menu, 
  X,
  Car,
  Calendar,
  Clock,
  ShieldCheck,
  Mic,
  MessageSquare,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Headphones
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BUSINESS_INFO = {
  name: "Kuwait Luxury Motors",
  location: "Kuwait City, Kuwait",
  founded: 2015,
  award: "Rated #1 Luxury Car Dealership in Kuwait 2026",
  type: "Premium Luxury & Sports Car Dealership",
  phone: "+965 1234 5678",
  openingHours: {
    weekdays: "Sat – Thu: 9:00 AM – 9:00 PM",
    friday: "Friday: 4:00 PM – 9:00 PM"
  },
  services: [
    "New luxury and sports cars",
    "Certified pre-owned cars",
    "Test drive booking",
    "Car financing",
    "Trade-in",
    "After-sales service"
  ],
  inventory: [
    { name: "Lamborghini Revuelto 2026", price: "Starting from KWD 180,000", type: "Supercar", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800" },
    { name: "Porsche 911 GT3 RS", price: "KWD 75,000", type: "Sports", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800" },
    { name: "Range Rover Autobiography", price: "KWD 45,000", type: "Luxury SUV", img: "https://images.unsplash.com/photo-1621275471769-e6aa3e1520e8?auto=format&fit=crop&q=80&w=800" },
    { name: "Mercedes-AMG G63", price: "KWD 58,000", type: "Luxury SUV", img: "https://images.unsplash.com/photo-1520050206274-a1af4464086d?auto=format&fit=crop&q=80&w=800" }
  ]
};

const SYSTEM_INSTRUCTION = `
You are the AI Voice Support Assistant for Kuwait Luxury Motors.
Persona: A young Kuwaiti girl, friendly, energetic, polite, and cheerful. 
Identity: You are a warm, sweet, and respectful young Kuwaiti female professional.
Language: Fluently speak both English and Kuwaiti Arabic.
Voice-First Interaction: You primarily communicate via voice. Keep responses short, clear, and natural.

Behavioral Rules:
1. Always start with the warm bilingual greeting: "Hala wallah! 😊 مرحبا في كويت لكشيري موتورز! Shlonik? Welcome to Kuwait Luxury Motors! How can I help you today?"
2. Detect the visitor’s language. If they speak English, respond in English. If they speak Arabic, use a natural Kuwaiti dialect.
3. Use ONLY the provided business information. If you don't know the answer, say honestly: "Sorry, I don't have this information right now" and guide them to book a test drive or call the showroom at ${BUSINESS_INFO.phone}.
4. Qualification Flow (One question at a time):
   - What is your first name?
   - Which car are you interested in?
   - New or used?
   - Budget range (if comfortable)?
   - When do you want to do the test drive?
5. After collecting info, summarize clearly and guide them to book or call.

Tone: Friendly, sweet, energetic, respectful, and helpful—like a happy young Kuwaiti girl.
`;

const HERO_SLIDES = [
  { url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1920", title: "Luxury Redefined", subtitle: "Experience the pinnacle of automotive excellence in Kuwait." },
  { url: "https://images.unsplash.com/photo-1617469767053-d3b508a0d182?auto=format&fit=crop&q=80&w=1920", title: "Precision Engineering", subtitle: "Hand-picked selection of the world's most desired sports cars." },
  { url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1920", title: "Legacy of Performance", subtitle: "New and pre-owned masterpieces with certified warranty." }
];

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [useVoice, setUseVoice] = useState(true);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (e: any) => {
        console.error("Speech Error", e);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  // Text to Speech
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Target a warm, young female voice
    const arVoice = voices.find(v => v.lang.startsWith('ar') && v.name.includes('Female'));
    const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English')));
    
    // Check if the current text block looks like Arabic to switch voice profile
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    if (hasArabic && arVoice) {
      utterance.voice = arVoice;
      utterance.lang = 'ar-SA';
    } else if (enVoice) {
      utterance.voice = enVoice;
      utterance.lang = 'en-US';
    }
    
    utterance.rate = 1.05;
    utterance.pitch = 1.15;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // Removed auto-greeting useEffect that was speaking on mount

  const handleOpenAssistant = () => {
    setIsAssistantOpen(true);
    if (!hasGreeted) {
      const greeting = "Hala wallah! 😊 مرحبا في كويت لكشيري موتورز! Shlonik? Welcome to Kuwait Luxury Motors! How can I help you today?";
      setMessages([{ role: 'assistant', content: greeting }]);
      speakText(greeting);
      setHasGreeted(true);
    }
  };

  // Carousel logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const newUserMessage = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      });

      const response = await chat.sendMessage({ message: text });
      const aiResponse = response.text || "I'm sorry, I couldn't process that.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      speakText(aiResponse);
    } catch (error) {
      console.error("AI Error:", error);
      const fallback = "Sorry, I'm having a technical issue. Please call us at " + BUSINESS_INFO.phone;
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      speakText(fallback);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsSpeaking(false);
      window.speechSynthesis.cancel();
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-brand-red/20 h-20 flex items-center">
        <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="bg-brand-red p-2 rounded-lg">
              <Car className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tighter uppercase italic">Kuwait Luxury Motors</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-widest hidden md:block">Authorized Premium Dealership</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-8">
            {["Current Inventory", "Finance", "Services", "About Us"].map((link) => (
              <a key={link} href="#" className="text-sm font-medium text-gray-400 hover:text-white hover:underline underline-offset-8 transition-all">
                {link}
              </a>
            ))}
          </nav>

          {/* Contact Actions */}
          <div className="flex items-center gap-6">
            <button className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <MapPin size={16} className="text-brand-red" />
              <span>Kuwait City</span>
            </button>
            <button className="md:px-6 py-2.5 bg-brand-red hover:bg-red-700 text-white font-bold rounded-full text-sm transition-all shadow-lg shadow-red-900/20 active:scale-95">
              Book Test Drive
            </button>
            <button className="xl:hidden" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[85vh] w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <img 
                src={HERO_SLIDES[currentSlide].url} 
                className="w-full h-full object-cover grayscale-[30%]" 
                alt="Luxury Car"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div className="max-w-4xl px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="inline-block px-4 py-1 bg-brand-red text-[10px] font-bold uppercase tracking-[0.3em] mb-6 shadow-glow">
                      The Excellence Standard
                    </span>
                    <h1 className="text-6xl lg:text-8xl font-black mb-8 italic uppercase tracking-tighter">
                      {HERO_SLIDES[currentSlide].title}
                    </h1>
                    <p className="text-xl lg:text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                      {HERO_SLIDES[currentSlide].subtitle}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Indicators */}
          <div className="absolute bottom-12 right-12 flex gap-3">
            {HERO_SLIDES.map((_, i) => (
              <button 
                key={i} 
                className={`h-1 transition-all rounded-full ${currentSlide === i ? 'w-12 bg-brand-red' : 'w-4 bg-gray-600'}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </section>

        {/* Inventory Highlights */}
        <section className="py-24 luxury-gradient">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-4xl font-black italic uppercase mb-2">Featured Showroom</h2>
                <p className="text-gray-400">Our latest collection of performance and luxury assets.</p>
              </div>
              <button className="group flex items-center gap-2 text-brand-red font-bold hover:text-white transition-colors">
                View All Inventory <ChevronLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {BUSINESS_INFO.inventory.map((car, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="glass-panel group rounded-3xl overflow-hidden cursor-pointer"
                >
                  <div className="h-56 relative overflow-hidden">
                    <img src={car.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={car.name} referrerPolicy="no-referrer" />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                      {car.type}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-1">{car.name}</h3>
                    <p className="text-brand-red font-mono text-sm font-bold">{car.price}</p>
                    <button className="w-full mt-6 py-3 border border-white/10 rounded-xl hover:bg-white text-sm font-bold hover:text-black transition-all">
                      Inquire Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Services & Trust */}
        <section className="bg-black py-24 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="flex gap-6">
                <div className="shrink-0 w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Extended Warranty</h4>
                  <p className="text-gray-400 text-sm">Comprehensive coverage for up to 5 years even on pre-owned masterpieces.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="shrink-0 w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red">
                  <Calendar size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Finance Partners</h4>
                  <p className="text-gray-400 text-sm">Tailored financial solutions with leading Kuwaiti banks for flexible ownership.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="shrink-0 w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red">
                  <Clock size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Elite Service</h4>
                  <p className="text-gray-400 text-sm">Concierge-style maintenance with pick-up and drop-off facility across Kuwait.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black py-16 px-4 border-t border-white/5">
        <div className="container mx-auto grid md:grid-cols-4 gap-12 text-sm">
          <div className="col-span-1 md:col-span-2">
            <h5 className="font-bold text-lg mb-6 tracking-tighter italic">KUWAIT LUXURY MOTORS</h5>
            <p className="text-gray-400 max-w-sm mb-6">
              The ultimate destination for premium performance and luxury automobiles in the State of Kuwait since 1998.
            </p>
            <div className="flex gap-4">
              <Phone size={20} className="text-brand-red" />
              <span className="font-mono text-lg">{BUSINESS_INFO.phone}</span>
            </div>
          </div>
          <div>
            <h6 className="font-bold uppercase text-xs tracking-widest mb-6">Explore</h6>
            <ul className="space-y-4 text-gray-400 italic">
              <li><a href="#" className="hover:text-white">New Arrivals</a></li>
              <li><a href="#" className="hover:text-white">Pre-owned Certified</a></li>
              <li><a href="#" className="hover:text-white">Track Performance</a></li>
              <li><a href="#" className="hover:text-white">Bespoke Concierge</a></li>
            </ul>
          </div>
          <div>
            <h6 className="font-bold uppercase text-xs tracking-widest mb-6">Hours</h6>
            <ul className="space-y-4 text-gray-400">
              <li>{BUSINESS_INFO.openingHours.weekdays}</li>
              <li>{BUSINESS_INFO.openingHours.friday}</li>
              <li className="pt-4"><a href="#" className="text-brand-red font-bold underline underline-offset-4">Get Directions</a></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* AI Voice Assistant Noura */}
      <div className="fixed bottom-8 left-8 z-[1000] flex flex-col items-start gap-4" dir="rtl">
        <AnimatePresence>
          {isAssistantOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-80 md:w-96 glass-panel rounded-3xl overflow-hidden shadow-2xl overflow-y-hidden flex flex-col h-[500px]"
            >
              <div className="bg-brand-red p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                    <Sparkles size={20} className="text-white animate-pulse" />
                    {isSpeaking && (
                      <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-50" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-none">AI Support Assistant</h3>
                    <p className="text-[10px] opacity-80 mt-1">Kuwait Luxury Motors</p>
                  </div>
                </div>
                <button onClick={() => setIsAssistantOpen(false)} className="text-white/80 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      m.role === 'user' 
                        ? 'bg-white/10 text-white rounded-tr-none' 
                        : 'bg-brand-red/10 text-gray-200 border border-brand-red/20 rounded-tl-none whitespace-pre-wrap'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/5 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                    placeholder="Ask about a car, booking..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-red"
                  />
                  <button 
                    onClick={() => handleSendMessage(inputMessage)}
                    className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <button 
                    onClick={toggleListening}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      isListening ? 'bg-white text-brand-red animate-pulse' : 'bg-brand-red text-white'
                    }`}
                  >
                    {isListening ? (
                      <><Mic size={14} className="animate-bounce" /> Listening...</>
                    ) : (
                      <><Mic size={14} /> Voice Mode</>
                    )}
                  </button>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setUseVoice(!useVoice)}
                      className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${useVoice ? 'text-brand-red' : 'text-gray-500'}`}
                    >
                      {useVoice ? 'Voice First' : 'Text Focused'}
                    </button>
                    {isSpeaking ? <Volume2 size={16} className="text-brand-red animate-pulse" /> : <VolumeX size={16} className="text-gray-600" />}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={handleOpenAssistant}
          className="group relative flex items-center gap-3 bg-brand-red hover:bg-red-700 text-white px-6 py-4 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <div className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
          </div>
          <Headphones size={24} />
          <span className="text-sm">AI Voice Support</span>
          <div className="h-6 w-px bg-white/20 mx-2" />
          <div className="flex flex-col items-start leading-none text-[10px] text-white/80">
            <span>Kuwait Luxury Motors</span>
            <span className="mt-0.5">Voice Support | عربي</span>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -200 }}
            className="fixed inset-0 z-[1000] bg-black p-8 flex flex-col gap-8"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold italic text-xl">MENU</span>
              <button onClick={() => setIsMenuOpen(false)}><X size={32} /></button>
            </div>
            <nav className="flex flex-col gap-8">
              {["Inventory", "Special Offers", "Financing", "Maintenance", "About"].map(link => (
                <a key={link} href="#" className="text-3xl font-black italic uppercase italic hover:text-brand-red transition-all">
                  {link}
                </a>
              ))}
            </nav>
            <div className="mt-auto border-t border-white/10 pt-8 italic text-gray-400">
              <p className="mb-2">Kuwait City, Sector 4</p>
              <p className="font-mono text-white text-lg">{BUSINESS_INFO.phone}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
