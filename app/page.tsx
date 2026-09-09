"use client";

import React, { useState, Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { translations, Language } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { 
  ClipboardList, 
  CreditCard, 
  Ambulance, 
  Stethoscope, 
  Baby, 
  HeartPulse, 
  Activity, 
  FlaskConical, 
  Bed,
  Monitor,
  Building2,
  ArrowLeft,
  Phone,
  User,
  Users,
  Heart,
  UserCheck,
  ChevronRight,
  MapPin,
  Star,
  Mic,
  Square,
  RotateCcw,
  Search,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

function RatingForm() {
  const searchParams = useSearchParams();
  const urlDept = searchParams.get('dept');
  
  const [lang, setLang] = useState<Language>('uz');
  const t = translations[lang];

  const [selectedType, setSelectedType] = useState<'general' | 'floor' | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedParentDept, setSelectedParentDept] = useState<any | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(() => {
    if (urlDept) return urlDept;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('dept');
    }
    return null;
  });
  const [selectedRole, setSelectedRole] = useState<string | null>('PATIENT');
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [activeFloorTab, setActiveFloorTab] = useState<number | 'all'>('all');
  const [statsionarOrder, setStatsionarOrder] = useState<'special_first' | 'floors_first'>('special_first');
  const [systemSettings, setSystemSettings] = useState<any>(null);

  const isRoom = (d: any) => 
    Boolean(d?.code?.startsWith('xona-') || /^\d+-xona/i.test(d?.name || '') || d?.name?.toLowerCase().includes('xona'));

  const extractRoomNumber = (name: string) => {
    const match = name.match(/\d+/);
    return match ? match[0] : name;
  };

  const isSpecialDept = (d: any) => 
    Boolean(
      d?.type === 'special' || 
      (d?.type === 'floor' && !isRoom(d) && (['tugruq', 'neonatologiya', 'operatsiya'].includes(d?.code) || d?.floor === 2))
    );

  const floorNumbers = useMemo(() => {
    const set = new Set<number>();
    departments
      .filter(d => (d.type === 'floor') && d.active && !isSpecialDept(d) && d.floor !== null && d.floor !== undefined && d.floor >= 3)
      .forEach(d => set.add(d.floor));
    const sorted = Array.from(set).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : [3, 4, 5, 6];
  }, [departments]);

  const specialFloorDepts = useMemo(() => {
    return departments
      .filter(d => 
        (d.type === 'floor' || d.type === 'special') && 
        d.active && 
        !isRoom(d) && 
        isSpecialDept(d)
      )
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [departments]);

  const getRoomsForFloor = (floorNum: number) => {
    return departments
      .filter(d => isRoom(d) && d.floor === floorNum && d.active)
      .sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });
  };

  const getFloorSummaryDept = (floorNum: number) => {
    return departments.find(d => 
      !isRoom(d) && 
      d.type === 'floor' && 
      d.floor === floorNum && 
      !isSpecialDept(d)
    );
  };

  const availableFloors = useMemo(() => {
    const floorSet = new Set<number>();
    departments
      .filter(d => (d.type === 'floor' || d.type === 'special') && d.active && d.floor !== null && d.floor !== undefined)
      .forEach(d => floorSet.add(d.floor));
    return Array.from(floorSet).sort((a, b) => a - b);
  }, [departments]);

  // Keep selectedDept in sync with urlDept parameter
  useEffect(() => {
    if (urlDept) {
      setSelectedDept(urlDept);
    }
  }, [urlDept]);

  // Fetch departments from backend API and auto-resolve selectedType
  useEffect(() => {
    setIsLoadingDepts(true);
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data);
        setIsLoadingDepts(false);
        const deptCode = urlDept || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('dept') : null);
        if (deptCode && Array.isArray(data)) {
          const found = data.find((d: any) => d.code === deptCode);
          if (found) {
            setSelectedType(found.type === 'special' ? 'floor' : found.type);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load departments', err);
        setIsLoadingDepts(false);
      });

    // Fetch system settings (e.g., statsionar display order, logo, clinic name)
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSystemSettings(data);
        if (data?.statsionarOrder) {
          setStatsionarOrder(data.statsionarOrder);
        }
      })
      .catch((err) => console.error('Failed to load settings', err));
  }, [urlDept]);
  
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [comment, setComment] = useState('');
  const [phone, setPhone] = useState('');
  const [wantsCall, setWantsCall] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioBlobRef = React.useRef<Blob | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addToast(
          lang === 'uz'
            ? "Ovoz yozish uchun xavfsiz ulanish (HTTPS) yoki localhost talab qilinadi!"
            : "Для записи голоса требуется безопасное соединение (HTTPS)!",
          'error'
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          options = { mimeType: 'audio/aac' };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      audioBlobRef.current = null;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        audioBlobRef.current = blob;
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Microphone xatosi:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        addToast(
          lang === 'uz'
            ? "Mikrofonga ruxsat berilmadi! Brauzeringizning manzil satridagi qulf/sozlama belgisini bosib, mikrofonga ruxsat bering."
            : "Доступ к микрофону заблокирован! Разрешите микрофон в настройках браузера.",
          'error'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        addToast(
          lang === 'uz'
            ? "Qurilmangizda mikrofon topilmadi! Iltimos, mikrofon yoki quloqchin (garnitura) ulang."
            : "Микрофон не найден! Подключите микрофон или гарнитуру.",
          'error'
        );
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        addToast(
          lang === 'uz'
            ? "Mikrofon boshqa ilova (masalan Telegram, Zoom) tomonidan band qilingan!"
            : "Микрофон занят другим приложением!",
          'error'
        );
      } else {
        addToast(
          lang === 'uz'
            ? `Mikrofon xatosi: ${err.message || 'Ruxsat berilmadi'}`
            : `Ошибка микрофона: ${err.message || 'Доступ запрещен'}`,
          'error'
        );
      }
    }
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
        recorder.addEventListener('stop', () => {
          setTimeout(() => {
            const mimeType = recorder.mimeType || 'audio/webm';
            const blob = audioBlobRef.current || (chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: mimeType }) : null);
            if (blob) {
              audioBlobRef.current = blob;
              setAudioBlob(blob);
              setAudioUrl(prev => prev || URL.createObjectURL(blob));
            }
            resolve(blob);
          }, 60);
        }, { once: true });

        recorder.stop();
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        resolve(audioBlobRef.current || audioBlob);
      }
    });
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const discardAudio = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
        recorder.stream?.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    audioBlobRef.current = null;
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (selectedDept) {
      setRatings({});
      setWantsCall(false);
      setPhone('');
    }
  }, [selectedDept]);

  useEffect(() => {
    if (isSuccess) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0A9C54', '#3b82f6', '#f59e0b']
      });
    }
  }, [isSuccess]);

  const activeDeptData = departments.find(d => d.code === selectedDept);
  
  const hasLowRating = useMemo(() => {
    return Object.values(ratings).some(r => r > 0 && r <= 2);
  }, [ratings]);

  const { addToast, ToastContainer } = useToast();

  const resetForm = () => {
    setOverallScore(null);
    setRatings({});
    setTextAnswers({});
    setComment('');
    setPhone('');
    setWantsCall(false);
    setSelectedRole('PATIENT');
    setIsSuccess(false);
    discardAudio();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    
    setIsSubmitting(true);
    try {
      // Ovoz yozish to'xtatilmasdan "Yuborish" bosilgan bo'lsa, avtomatik to'xtatib audio faylni olamiz:
      let finalAudioBlob = audioBlobRef.current || audioBlob;
      if (isRecording || (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording')) {
        const recordedBlob = await stopRecording();
        if (recordedBlob && recordedBlob.size > 0) {
          finalAudioBlob = recordedBlob;
        }
      }

      const formData = new FormData();
      formData.append('department', selectedDept);
      if (selectedRole) formData.append('respondentType', selectedRole);
      if (comment.trim()) formData.append('comment', comment);
      if (wantsCall && phone.trim()) formData.append('phone', phone);
      
      const values = activeDeptData?.criteria?.map((c: any) => ({
        criterionId: c.id,
        score: ratings[c.id] || (overallScore ? overallScore : 0),
        textAnswer: textAnswers[c.id] || null
      })) || [];
      formData.append('values', JSON.stringify(values));
      if (overallScore) formData.append('overallScore', overallScore.toString());

      if (finalAudioBlob && finalAudioBlob.size > 0) {
        formData.append('audio', finalAudioBlob, 'voice.webm');
      }

      const res = await fetch('/api/ratings', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      console.error(error);
      addToast(t.error, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeptInfo = (deptCode: string) => {
    const lower = deptCode ? deptCode.toLowerCase() : '';
    const dept = departments.find((d) => d.code === deptCode || d.code?.toLowerCase() === lower);
    const parent = dept?.parentId ? departments.find(p => p.id === dept.parentId) : null;

    // Icon and style map for known department codes
    const styleMap: Record<string, { icon: React.ReactNode, bg: string, color: string }> = {
      reception: { icon: <ClipboardList size={28} strokeWidth={2} className="text-current" />, bg: 'bg-emerald-100/60', color: 'text-emerald-600' },
      kassa: { icon: <CreditCard size={28} strokeWidth={2} className="text-current" />, bg: 'bg-blue-100/60', color: 'text-blue-600' },
      qabulxona: { icon: <Ambulance size={28} strokeWidth={2} className="text-current" />, bg: 'bg-indigo-100/60', color: 'text-indigo-600' },
      shifokorlar: { icon: <Stethoscope size={28} strokeWidth={2} className="text-current" />, bg: 'bg-violet-100/60', color: 'text-violet-600' },
      uzi: { icon: <Monitor size={28} strokeWidth={2} className="text-current" />, bg: 'bg-fuchsia-100/60', color: 'text-fuchsia-600' },
      tugruq: { icon: <HeartPulse size={28} strokeWidth={2} className="text-current" />, bg: 'bg-pink-100/60', color: 'text-pink-600' },
      neonatologiya: { icon: <Baby size={28} strokeWidth={2} className="text-current" />, bg: 'bg-cyan-100/60', color: 'text-cyan-600' },
      operatsiya: { icon: <Activity size={28} strokeWidth={2} className="text-current" />, bg: 'bg-red-100/60', color: 'text-red-600' },
      reanimatsiya: { icon: <HeartPulse size={28} strokeWidth={2} className="text-current" />, bg: 'bg-rose-100/60', color: 'text-rose-600' },
      laboratoriya: { icon: <FlaskConical size={28} strokeWidth={2} className="text-current" />, bg: 'bg-orange-100/60', color: 'text-orange-600' },
      '3-qavat': { icon: <Bed size={28} strokeWidth={2} className="text-current" />, bg: 'bg-amber-100/60', color: 'text-amber-600' },
      '4-qavat': { icon: <Bed size={28} strokeWidth={2} className="text-current" />, bg: 'bg-yellow-100/60', color: 'text-yellow-600' },
      '5-qavat': { icon: <Bed size={28} strokeWidth={2} className="text-current" />, bg: 'bg-lime-100/60', color: 'text-lime-600' },
      '6-qavat': { icon: <Bed size={28} strokeWidth={2} className="text-current" />, bg: 'bg-teal-100/60', color: 'text-teal-600' },
    };

    // 1. Direct code lookup (case-insensitive)
    let style = styleMap[lower];

    // 2. If child department, inherit from parent!
    if (!style && parent && parent.code) {
      style = styleMap[parent.code.toLowerCase()];
    }

    // 3. Keyword matching from name or code
    if (!style) {
      const checkStr = `${lower} ${dept?.name?.toLowerCase() || ''} ${parent?.name?.toLowerCase() || ''}`;
      if (checkStr.includes('uzi') || checkStr.includes('exo') || checkStr.includes('skop')) {
        style = styleMap.uzi;
      } else if (checkStr.includes('kassa') || checkStr.includes('tolov') || checkStr.includes("to'lov")) {
        style = styleMap.kassa;
      } else if (checkStr.includes('laborator') || checkStr.includes('tahlil') || checkStr.includes('analiz')) {
        style = styleMap.laboratoriya;
      } else if (checkStr.includes('vrach') || checkStr.includes('shifokor') || checkStr.includes('doktor')) {
        style = styleMap.shifokorlar;
      } else if (checkStr.includes('reception') || checkStr.includes('royxat') || checkStr.includes("ro'yxat")) {
        style = styleMap.reception;
      } else if (checkStr.includes('qabul')) {
        style = styleMap.qabulxona;
      } else if (checkStr.includes('tugruq') || checkStr.includes("tug'ruq")) {
        style = styleMap.tugruq;
      } else if (checkStr.includes('bolalar') || checkStr.includes('neonat')) {
        style = styleMap.neonatologiya;
      } else if (checkStr.includes('operats') || checkStr.includes('reanimat')) {
        style = styleMap.operatsiya;
      } else if (dept?.type === 'floor' || isRoom(dept) || lower.startsWith('xona-')) {
        style = { icon: <Bed size={28} strokeWidth={2} className="text-current" />, bg: 'bg-emerald-100/60', color: 'text-emerald-700' };
      } else {
        style = { icon: <Building2 size={28} strokeWidth={2} className="text-current" />, bg: 'bg-emerald-100/60', color: 'text-[#0A9C54]' };
      }
    }

    if (dept) {
      const isDeptRoom = isRoom(dept);
      const roomFloorText = dept.floor 
        ? (lang === 'uz' ? `${dept.floor}-qavat palatasi` : `Палата на ${dept.floor}-м этаже`)
        : (lang === 'uz' ? `Statsionar palatasi` : `Больничная палата`);

      let desc = isDeptRoom 
        ? roomFloorText 
        : (dept.type === 'general' 
            ? (parent ? `${parent.name} xonasi` : (lang === 'uz' ? "Ambulator bo'lim" : "Амбулаторное отделение")) 
            : (lang === 'uz' ? "Statsionar bo'lim" : "Стационарное отделение"));

      return {
        name: dept.name,
        icon: style.icon,
        bg: style.bg,
        color: style.color,
        desc,
      };
    }

    if (lower.startsWith('xona-')) {
      const num = lower.replace('xona-', '');
      return {
        name: `${num}-xona`,
        icon: <Bed size={28} strokeWidth={2} className="text-current" />,
        bg: 'bg-emerald-100/60',
        color: 'text-emerald-700',
        desc: lang === 'uz' ? 'Statsionar palatasi' : 'Больничная палата',
      };
    }

    return {
      name: deptCode ? deptCode.toUpperCase() : '',
      icon: style.icon,
      bg: style.bg,
      color: style.color,
      desc: lang === 'uz' ? 'Klinika boʻlimi' : 'Отделение клиники',
    };
  };

  const getCommentPlaceholder = (deptCode: string | null) => {
    return t.commentPlaceholder;
  };

  // Reusable responsive Language Switcher component (flex, NOT absolute)
  const LangSwitcher = () => (
    <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 flex-shrink-0">
      <button 
        type="button"
        onClick={() => setLang('uz')} 
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${lang === 'uz' ? 'bg-[#0A9C54] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
      >
        UZ
      </button>
      <button 
        type="button"
        onClick={() => setLang('ru')} 
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${lang === 'ru' ? 'bg-[#0A9C54] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
      >
        RU
      </button>
    </div>
  );

  // 1. Success Screen
  if (isSuccess) {
    const scores = Object.values(ratings);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const isHighRating = averageScore >= 4;

    return (
      <div className="max-w-lg w-full bg-white sm:rounded-[2.5rem] sm:shadow-[0_20px_60px_rgb(0,0,0,0.08)] sm:border border-slate-100 p-6 sm:p-8 text-center min-h-screen sm:min-h-[640px] flex flex-col justify-between relative">
        <div className="flex items-center justify-end w-full">
          <LangSwitcher />
        </div>
        
        <div className="my-auto py-6">
          <div className="w-20 h-20 bg-[#0A9C54]/10 text-[#0A9C54] rounded-full flex items-center justify-center mx-auto text-4xl mb-5 shadow-xs">
            ✓
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2.5">{t.thanksTitle}</h2>
          <p className="text-[14px] text-slate-500 max-w-[320px] mx-auto leading-relaxed">
            {t.thanksMessage}
          </p>

          {isHighRating && (
            <div className="w-full bg-blue-50/60 border border-blue-100 rounded-2xl p-5 mt-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2.5">
                <Star className="fill-blue-500 text-blue-500" size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1.5">
                {lang === 'uz' ? "Bizni qo'llab-quvvatlang!" : "Поддержите нас!"}
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed max-w-[280px] mx-auto">
                {lang === 'uz' 
                  ? `${systemSettings?.clinicName || "Klinikamiz"} xizmatlaridan mamnun ekanligingizdan xursandmiz. Iltimos, xaritada ham 5 yulduz qoldiring.` 
                  : `Мы рады, что вы довольны нашими услугами. Пожалуйста, оставьте нам 5 звезд на карте.`}
              </p>
              <a 
                href={systemSettings?.googleMapsUrl || "https://maps.google.com/?q=Smile+Baby+Andijan"} 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-xs sm:text-sm"
              >
                <MapPin size={18} />
                {lang === 'uz' ? 'Google Maps orqali baholash' : 'Оценить в Google Maps'}
              </a>
            </div>
          )}
        </div>

        <button 
          type="button"
          onClick={() => {
            window.location.href = '/';
          }} 
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-2xl transition active:scale-95 cursor-pointer text-sm"
        >
          {t.backToHome}
        </button>
      </div>
    );
  }

  // 2. Type Selection Screen (Ambulator vs Statsionar)
  if (!selectedDept && !selectedType) {
    return (
      <div className="max-w-lg w-full bg-[#f8fafc] sm:bg-white sm:rounded-[2.5rem] sm:shadow-[0_20px_60px_rgb(0,0,0,0.08)] sm:border border-slate-100 overflow-hidden min-h-screen sm:min-h-[640px] flex flex-col relative">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#0A9C54]/5 to-transparent pointer-events-none"></div>

        <div className="px-5 sm:px-6 pt-6 pb-6 text-center bg-white/70 backdrop-blur-md rounded-b-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] z-10 relative border-b border-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-16"></div>
            <img 
              src={systemSettings?.logoUrl || "/logo.png"} 
              alt={systemSettings?.clinicName || "Smile Baby"} 
              className="h-12 w-auto object-contain drop-shadow-xs" 
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
            />
            <LangSwitcher />
          </div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight mb-1.5">{t.welcome}</h1>
          <p className="text-[14px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">{t.selectDepartment}</p>
        </div>
        
        <div className="p-5 sm:p-8 flex-1 flex flex-col justify-center gap-4 sm:gap-5 pb-10">
          <button 
            type="button"
            onClick={() => setSelectedType('general')}
            className="group relative bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-[#0A9C54]/30 transition-all duration-300 active:scale-[0.98] overflow-hidden cursor-pointer"
          >
            <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Stethoscope size={100} />
            </div>
            <div className="relative z-10 flex flex-col items-start gap-3.5">
              <div className="w-13 h-13 sm:w-14 sm:h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Stethoscope size={28} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-extrabold text-slate-800 mb-1">{lang === 'uz' ? 'Ambulator xizmatlar' : 'Амбулаторные услуги'}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-snug">{lang === 'uz' ? "Kassa, ro'yxatxona, UZI, laboratoriya va shifokorlar" : "Касса, регистратура, УЗИ, лаборатория и врачи"}</p>
              </div>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {
              setSelectedType('floor');
              setSelectedFloor(null);
            }}
            className="group relative bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-blue-500/30 transition-all duration-300 active:scale-[0.98] overflow-hidden cursor-pointer"
          >
            <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building2 size={100} />
            </div>
            <div className="relative z-10 flex flex-col items-start gap-3.5">
              <div className="w-13 h-13 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Building2 size={28} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-extrabold text-slate-800 mb-1">{lang === 'uz' ? "Statsionar bo'limlar" : "Стационарные отделения"}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-snug">{lang === 'uz' ? "Qavatlardagi sharoitlar, palatalar va reanimatsiya" : "Условия на этажах, палаты и реанимация"}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 3A. Ambulator bo'limlar tanlash ekrani
  if (!selectedDept && selectedType === 'general') {
    // 3A-1. Agar ota bo'lim tanlangan bo'lsa (masalan: UZI), uning ichki mini-bo'limlari/xonalari ekrani ochiladi
    if (selectedParentDept) {
      const childDepts = departments
        .filter(d => d.parentId === selectedParentDept.id && d.active)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      let filteredChildren = childDepts;
      if (deptSearchQuery.trim()) {
        const q = deptSearchQuery.toLowerCase().trim();
        filteredChildren = filteredChildren.filter(d =>
          d.name.toLowerCase().includes(q) || 
          d.code.toLowerCase().includes(q)
        );
      }

      const parentInfo = getDeptInfo(selectedParentDept.code);

      return (
        <div className="max-w-lg w-full bg-[#f8fafc] sm:bg-white sm:rounded-[2.5rem] sm:shadow-[0_20px_60px_rgb(0,0,0,0.08)] sm:border border-slate-100 overflow-hidden min-h-screen sm:min-h-[640px] flex flex-col relative">
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-slate-100/50 to-transparent pointer-events-none"></div>

          {/* Header */}
          <div className="px-5 sm:px-6 pt-6 pb-4 bg-white/80 backdrop-blur-md rounded-b-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] z-10 relative border-b border-white">
            <div className="flex items-center justify-between mb-3">
              <button 
                type="button"
                onClick={() => {
                  setSelectedParentDept(null);
                  setDeptSearchQuery('');
                }} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-all active:scale-90 cursor-pointer"
              >
                <ArrowLeft size={19} />
              </button>
              <LangSwitcher />
            </div>

            <div className="mb-3.5 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-[#0A9C54]/10 text-[#0A9C54] text-[11px] font-black uppercase">
                  {lang === 'uz' ? "Ambulator" : "Амбулаторное"}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  ↳ {selectedParentDept.name}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {selectedParentDept.name} {lang === 'uz' ? "xonasi / mutaxassisi" : "кабинеты"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'uz' ? "Baholamoqchi bo'lgan xona yoki shifokorni tanlang" : "Выберите кабинет или врача для оценки"}
              </p>
            </div>

            {/* Quick Search if more than 4 items */}
            {childDepts.length > 4 && (
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={deptSearchQuery}
                  onChange={(e) => setDeptSearchQuery(e.target.value)}
                  placeholder={lang === 'uz' ? "Qidirish..." : "Поиск..."}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0A9C54] focus:ring-2 focus:ring-[#0A9C54]/10 transition-all shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Sub-departments list */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto pb-10 space-y-4">
            {/* 1. Umumiy baholash varianti */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDept(selectedParentDept.code);
                  resetForm();
                }}
                className="w-full p-4 rounded-3xl bg-emerald-50/60 border border-[#0A9C54]/20 hover:border-[#0A9C54] hover:bg-emerald-50 transition-all flex items-center justify-between shadow-xs group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl ${parentInfo.bg} ${parentInfo.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    {parentInfo.icon}
                  </div>
                  <div>
                    <p className="text-[14px] font-extrabold text-slate-900 group-hover:text-[#0A9C54] transition-colors">
                      {lang === 'uz' ? `Umumiy ${selectedParentDept.name}` : `Общее отделение ${selectedParentDept.name}`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {lang === 'uz' ? "Xonani ajratmasdan butun bo'limni baholash" : "Оценка отделения в целом"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-[#0A9C54] transition-colors flex-shrink-0" />
              </button>
            </div>

            {/* 2. Ichki mini-bo'limlar (xona va mutaxassislar) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {lang === 'uz' ? "Xonalar / Mutaxassislar" : "Кабинеты / Специалисты"}
                </span>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {filteredChildren.length} {lang === 'uz' ? "ta" : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {filteredChildren.map(child => {
                  const childInfo = getDeptInfo(child.code);
                  return (
                    <button
                      key={child.code}
                      type="button"
                      onClick={() => {
                        setSelectedDept(child.code);
                        resetForm();
                      }}
                      className="group bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_4px_16px_rgb(0,0,0,0.03)] flex flex-col items-center justify-center gap-2.5 hover:border-[#0A9C54]/40 hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 active:scale-[0.97] cursor-pointer"
                    >
                      <div className={`w-14 h-14 rounded-2xl ${childInfo.bg} ${childInfo.color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 ease-out shadow-xs`}>
                        {childInfo.icon}
                      </div>
                      <span className="text-[13px] font-extrabold text-slate-800 text-center leading-tight group-hover:text-[#0A9C54] transition-colors">
                        {child.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3A-2. Asosiy Ambulator bo'limlar ro'yxati (faqat ota bo'limlar)
    let displayDepts = departments.filter(d => d.type === 'general' && d.active && !d.parentId);

    const isSearching = Boolean(deptSearchQuery.trim());
    if (isSearching) {
      const q = deptSearchQuery.toLowerCase().trim();
      displayDepts = departments.filter(d => 
        d.type === 'general' && d.active && (
          d.name.toLowerCase().includes(q) || 
          d.code.toLowerCase().includes(q)
        )
      );
    }

    return (
      <div className="max-w-lg w-full bg-[#f8fafc] sm:bg-white sm:rounded-[2.5rem] sm:shadow-[0_20px_60px_rgb(0,0,0,0.08)] sm:border border-slate-100 overflow-hidden min-h-screen sm:min-h-[640px] flex flex-col relative">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-slate-100/50 to-transparent pointer-events-none"></div>
        
        {/* Responsive Header: Top Bar + Title + Search */}
        <div className="px-5 sm:px-6 pt-6 pb-4 bg-white/80 backdrop-blur-md rounded-b-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] z-10 relative border-b border-white">
          <div className="flex items-center justify-between mb-3">
            <button 
              type="button"
              onClick={() => {
                setSelectedType(null);
                setSelectedParentDept(null);
                setDeptSearchQuery('');
              }} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-all active:scale-90 cursor-pointer"
            >
              <ArrowLeft size={19} />
            </button>
            <LangSwitcher />
          </div>

          <div className="mb-3.5 text-left">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'uz' ? "Ambulator bo'limlar" : "Амбулаторные отделения"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{t.selectDepartment}</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={deptSearchQuery}
              onChange={(e) => setDeptSearchQuery(e.target.value)}
              placeholder={lang === 'uz' ? "Bo'lim nomi bo'yicha qidirish..." : "Поиск по названию отделения..."}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0A9C54] focus:ring-2 focus:ring-[#0A9C54]/10 transition-all shadow-xs"
            />
            {deptSearchQuery && (
              <button
                type="button"
                onClick={() => setDeptSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto pb-10">
          {displayDepts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Search size={22} />
              </div>
              <p className="text-sm font-bold text-slate-700 mb-1">
                {lang === 'uz' ? "Hech qanday bo'lim topilmadi" : "Отделение не найдено"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
              {displayDepts.sort((a, b) => (a.order || 0) - (b.order || 0)).map(d => {
                const childCount = departments.filter(c => c.parentId === d.id && c.active).length;
                return (
                  <button 
                    key={d.code}
                    type="button"
                    onClick={() => {
                      if (childCount > 0 && !isSearching) {
                        setSelectedParentDept(d);
                        setDeptSearchQuery('');
                      } else {
                        setSelectedDept(d.code);
                        resetForm();
                      }
                    }}
                    className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_16px_rgb(0,0,0,0.03)] flex flex-col items-center justify-center gap-2.5 hover:border-[#0A9C54]/30 hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 active:scale-[0.97] cursor-pointer"
                  >
                    <div className={`w-15 h-15 rounded-[1.25rem] ${getDeptInfo(d.code).bg} ${getDeptInfo(d.code).color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 ease-out shadow-xs`}>
                      {getDeptInfo(d.code).icon}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[13px] font-extrabold text-slate-700 text-center leading-tight group-hover:text-slate-900 transition-colors">{d.name}</span>
                      {childCount > 0 && !isSearching && (
                        <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-full mt-1 border border-fuchsia-100">
                          {childCount} {lang === 'uz' ? 'ta xona' : 'каб.'}
                        </span>
                      )}
                      {d.parentId && isSearching && (
                        <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          ↳ {departments.find(p => p.id === d.parentId)?.name || ''}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3B. Statsionar Qavatlar va Bo'limlar ro'yxati (Katalog uslubi)
  if (!selectedDept && selectedType === 'floor' && selectedFloor === null) {
    let allFloorDepts = departments.filter(d => (d.type === 'floor' || d.type === 'special') && d.active);

    // Qidiruv bo'lganda to'g'ridan-to'g'ri barcha xona va bo'limlar orasidan topish
    if (deptSearchQuery.trim()) {
      const q = deptSearchQuery.toLowerCase().trim();
      const matchedDepts = allFloorDepts.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.code.toLowerCase().includes(q)
      );

      const matchedMain = matchedDepts.filter(d => !isRoom(d));
      const matchedRooms = matchedDepts.filter(d => isRoom(d)).sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });

      return (
        <div className="max-w-lg w-full bg-[#f8fafc] sm:bg-white sm:rounded-[2.5rem] sm:shadow-[0_20px_60px_rgb(0,0,0,0.08)] sm:border border-slate-100 overflow-hidden min-h-screen sm:min-h-[640px] flex flex-col relative">
          <div className="px-5 sm:px-6 pt-6 pb-4 bg-white/80 backdrop-blur-md rounded-b-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] z-10 relative border-b border-white">
            <div className="flex items-center justify-between mb-3">
              <button 
                type="button"
                onClick={() => setDeptSearchQuery('')} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-all active:scale-90 cursor-pointer"
              >
                <ArrowLeft size={19} />
              </button>
              <LangSwitcher />
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={deptSearchQuery}
                onChange={(e) => setDeptSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0A9C54] focus:ring-2 focus:ring-[#0A9C54]/10 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setDeptSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex-1 overflow-y-auto pb-10 space-y-6">
            {matchedDepts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search size={22} />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">
                  {lang === 'uz' ? "Hech qanday bo'lim yoki xona topilmadi" : "Ничего не найдено"}
                </p>
                <p className="text-xs text-slate-400">
                  {lang === 'uz' ? "Qidiruv so'zini tekshiring" : "Проверьте поисковый запрос"}
                </p>
              </div>
            ) : (
              <>
                {matchedMain.length > 0 && (
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                      {t.specialDepartments}
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      {matchedMain.map(d => (
                        <button 
                          key={d.code}
                          type="button"
                          onClick={() => {
                            setSelectedDept(d.code);
                            resetForm();
                          }}
                          className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3 hover:border-[#0A9C54]/30 transition-all cursor-pointer text-left"
                        >
                          <div className={`w-10 h-10 rounded-xl ${getDeptInfo(d.code).bg} ${getDeptInfo(d.code).color} flex items-center justify-center flex-shrink-0`}>
                            {getDeptInfo(d.code).icon}
                          </div>
                          <span className="text-xs font-bold text-slate-800 line-clamp-2">{d.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchedRooms.length > 0 && (
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                      {lang === 'uz' ? 'Topilgan xonalar' : 'Найденные палаты'} ({matchedRooms.length})
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                      {matchedRooms.map(d => (
                        <button 
                          key={d.code}
                          type="button"
                          onClick={() => {
                            setSelectedDept(d.code);
                            resetForm();
                          }}
                          className="group bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#0A9C54] hover:bg-emerald-50/40 transition-all active:scale-95 flex flex-col items-center justify-center text-center cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-[#0A9C54]/15 group-hover:text-[#0A9C54] flex items-center justify-center mb-1 transition-colors">
                            <Bed size={15} strokeWidth={2.2} />
                          </div>
                          <span className="text-[13px] font-black text-slate-800 group-hover:text-[#0A9C54] transition-colors leading-tight">
                            {extractRoomNumber(d.name)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {t.room}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    // Normal katalog ko'rinishi: Qavatlar kartalari + Maxsus bo'limlar (tartib sozlamaga bog'liq)
    const floorsSection = (
      <div key="floors-section">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#0A9C54]"></div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            {t.floorDepartments}
          </span>
        </div>

        <div className="space-y-3">
          {floorNumbers.map((fl) => {
            const floorRooms = getRoomsForFloor(fl);
            const summaryDept = getFloorSummaryDept(fl);

            return (
              <button
                key={fl}
                type="button"
                onClick={() => {
                  if (floorRooms.length > 0) {
                    setSelectedFloor(fl);
                  } else if (summaryDept) {
                    setSelectedDept(summaryDept.code);
                    resetForm();
                  } else {
                    setSelectedFloor(fl);
                  }
                }}
                className="w-full group bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-[0_4px_16px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] hover:border-[#0A9C54]/40 transition-all duration-200 active:scale-[0.98] flex items-center justify-between cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0A9C54] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Bed size={24} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-[15px] sm:text-base font-extrabold text-slate-900 group-hover:text-[#0A9C54] transition-colors">
                      {fl}-qavat (Statsionar)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {floorRooms.length > 0 
                        ? `${floorRooms.length} ${t.roomsCount} (${floorRooms[0] ? extractRoomNumber(floorRooms[0].name) : ''}–${floorRooms[floorRooms.length - 1] ? extractRoomNumber(floorRooms[floorRooms.length - 1].name) : ''})` 
                        : (lang === 'uz' ? 'Yotib davolanish palatalari' : 'Палаты стационара')}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#0A9C54]/10 text-slate-400 group-hover:text-[#0A9C54] flex items-center justify-center transition-colors flex-shrink-0 ml-2">
                  <ChevronRight size={18} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );

    const specialDeptsSection = specialFloorDepts.length > 0 ? (
      <div key="special-depts-section">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            {t.specialDepartments}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {specialFloorDepts.map(d => (
            <button 
              key={d.code}
              type="button"
              onClick={() => {
                setSelectedDept(d.code);
                resetForm();
              }}
              className="group bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_4px_16px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] hover:border-[#0A9C54]/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97] flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer"
            >
              <div className={`w-13 h-13 rounded-2xl ${getDeptInfo(d.code).bg} ${getDeptInfo(d.code).color} flex items-center justify-center group-hover:scale-110 transition-all duration-200 shadow-2xs`}>
                {getDeptInfo(d.code).icon}
              </div>
              <span className="text-xs font-extrabold text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">
                {d.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    ) : null;

    return (
      <div className="max-w-lg w-full bg-[#f8fafc] sm:bg-white sm:rounded-[2.5rem] sm:shadow-[0_20px_60px_rgb(0,0,0,0.08)] sm:border border-slate-100 overflow-hidden min-h-screen sm:min-h-[640px] flex flex-col relative">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-slate-100/50 to-transparent pointer-events-none"></div>
        
        {/* Responsive Header (Top Bar + Title + Search) */}
        <div className="px-5 sm:px-6 pt-6 pb-4 bg-white/80 backdrop-blur-md rounded-b-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] z-10 relative border-b border-white">
          <div className="flex items-center justify-between mb-3">
            <button 
              type="button"
              onClick={() => {
                setSelectedType(null);
                setDeptSearchQuery('');
              }} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-all active:scale-90 cursor-pointer"
            >
              <ArrowLeft size={19} />
            </button>
            <LangSwitcher />
          </div>

          <div className="mb-3.5 text-left">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'uz' ? "Statsionar bo'limlar" : "Стационарные отделения"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{t.selectFloor}</p>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={deptSearchQuery}
              onChange={(e) => setDeptSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0A9C54] focus:ring-2 focus:ring-[#0A9C54]/10 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Content: Qavatlar ro'yxati va Maxsus bo'limlar (admin belgilagan tartibda) */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto pb-10 space-y-6 relative z-10">
          {statsionarOrder === 'special_first' ? (
            <>
              {specialDeptsSection}
              {floorsSection}
            </>
          ) : (
            <>
              {floorsSection}
              {specialDeptsSection}
            </>
          )}
        </div>
      </div>
    );
  }

  // 3C. Tanlangan qavatning xonalarini tanlash ekrani
  if (!selectedDept && selectedType === 'floor' && selectedFloor !== null) {
    const roomsForCurrentFloor = getRoomsForFloor(selectedFloor);
    const floorSummaryDept = getFloorSummaryDept(selectedFloor);

    // Qavat ichidagi xonalarni tezkor qidirish
    let filteredRooms = roomsForCurrentFloor;
    if (deptSearchQuery.trim()) {
      const q = deptSearchQuery.toLowerCase().trim();
      filteredRooms = filteredRooms.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.code.toLowerCase().includes(q)
      );
    }

    return (
      <div className="max-w-lg w-full bg-[#f8fafc] sm:bg-white sm:rounded-[2.5rem] sm:shadow-[0_20px_60px_rgb(0,0,0,0.08)] sm:border border-slate-100 overflow-hidden min-h-screen sm:min-h-[640px] flex flex-col relative">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-slate-100/50 to-transparent pointer-events-none"></div>
        
        {/* Responsive Header: Top Bar + Title + Search */}
        <div className="px-5 sm:px-6 pt-6 pb-4 bg-white/80 backdrop-blur-md rounded-b-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] z-10 relative border-b border-white">
          <div className="flex items-center justify-between mb-3">
            <button 
              type="button"
              onClick={() => {
                setSelectedFloor(null);
                setDeptSearchQuery('');
              }} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-all active:scale-90 cursor-pointer"
            >
              <ArrowLeft size={19} />
            </button>
            <LangSwitcher />
          </div>

          <div className="mb-3.5 text-left">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#0A9C54]/10 text-[#0A9C54] text-[11px] font-black uppercase">
                {selectedFloor}-qavat
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              {lang === 'uz' ? `${selectedFloor}-qavat palatalari` : `Палаты ${selectedFloor}-го этажа`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{t.selectRoom}</p>
          </div>

          {/* Quick Room Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={deptSearchQuery}
              onChange={(e) => setDeptSearchQuery(e.target.value)}
              placeholder={lang === 'uz' ? "Xona raqami... (masalan: 305)" : "Номер палаты... (напр. 305)"}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0A9C54] focus:ring-2 focus:ring-[#0A9C54]/10 transition-all shadow-xs"
            />
            {deptSearchQuery && (
              <button
                type="button"
                onClick={() => setDeptSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content: Butun qavatni baholash + Xonalar panjarasi */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto pb-10 space-y-4 relative z-10">
          
          {/* Umumiy qavatni baholash opsiyasi */}
          {floorSummaryDept && !deptSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setSelectedDept(floorSummaryDept.code);
                resetForm();
              }}
              className="w-full bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/70 p-3.5 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0A9C54] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    {lang === 'uz' ? `Butun ${selectedFloor}-qavatni umumiy baholash` : `Оценить весь ${selectedFloor}-й этаж`}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {lang === 'uz' ? "Alohida xonani emas, umumiy qavat sharoitlarini baholash" : "Оценка условий всего этажа в целом"}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-emerald-600 flex-shrink-0 ml-2" />
            </button>
          )}

          {/* Xonalar panjarasi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                {lang === 'uz' ? 'Xonangizni tanlang:' : 'Выберите палату:'}
              </span>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {filteredRooms.length} {t.roomsCount}
              </span>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
                {lang === 'uz' ? "Bu raqamdagi xona topilmadi" : "Палата с таким номером не найдена"}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {filteredRooms.map(d => (
                  <button 
                    key={d.code}
                    type="button"
                    onClick={() => {
                      setSelectedDept(d.code);
                      resetForm();
                    }}
                    className="group bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:border-[#0A9C54] hover:bg-emerald-50/40 hover:shadow-md transition-all duration-200 active:scale-95 flex flex-col items-center justify-center text-center relative cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-[#0A9C54]/15 group-hover:text-[#0A9C54] flex items-center justify-center mb-1 transition-colors">
                      <Bed size={15} strokeWidth={2.2} />
                    </div>
                    <span className="text-[14px] font-black text-slate-800 group-hover:text-[#0A9C54] transition-colors leading-tight">
                      {extractRoomNumber(d.name)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors -mt-0.5">
                      {t.room}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // 4. Role Selection Screen has been removed as per the owner's request.

  const canSubmit = Boolean(overallScore);
  
  const deptInfo = selectedDept ? getDeptInfo(selectedDept) : null;

  const roleLabelMap: Record<string, string> = {
    PATIENT: t.rolePatient,
    PARENT: t.roleParent,
    SPOUSE: t.roleSpouse,
    RELATIVE: t.roleRelative
  };

  return (
    <div className="max-w-lg w-full bg-white sm:rounded-[2.5rem] sm:shadow-[0_20px_60px_rgb(0,0,0,0.08)] sm:border border-slate-100 overflow-hidden min-h-screen sm:min-h-[640px] relative flex flex-col">
      <ToastContainer />
      {/* Responsive Rating Form Header: Top Bar with Back, Logo, and Language Switcher */}
      <div className="px-5 sm:px-6 pt-6 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <button 
            type="button"
            onClick={() => {
              if (urlDept) {
                window.location.href = '/';
              } else {
                setSelectedDept(null);
              }
            }} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs transition-all active:scale-90 cursor-pointer flex-shrink-0"
          >
            <ArrowLeft size={19} />
          </button>

          <img 
            src={systemSettings?.logoUrl || "/logo.png"} 
            alt={systemSettings?.clinicName || "Smile Baby"} 
            className="h-9 w-auto object-contain" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
          />

          <LangSwitcher />
        </div>

        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 text-center tracking-tight">
          {t.rateCriteria}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto pb-10">
        
        {/* Department Selection Display */}
        {deptInfo && (
          <div>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0A9C54]/5 border border-[#0A9C54]/10 relative">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className={`p-2.5 rounded-xl ${deptInfo.bg} ${deptInfo.color} shadow-xs flex-shrink-0`}>{deptInfo.icon}</span>
                <div className="overflow-hidden">
                  <p className="text-[14px] font-extrabold text-slate-800 leading-tight truncate">{deptInfo.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{deptInfo.desc}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Emojis (HappyOrNot uslubi) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
            Bugungi xizmatimiz sizga yoqdimi?
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button 
              type="button"
              onClick={() => setOverallScore(1)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border-2 transition-all active:scale-95 cursor-pointer ${
                overallScore === 1 
                  ? 'bg-red-50 border-red-500 shadow-md scale-105' 
                  : 'bg-slate-50 border-transparent hover:bg-slate-100'
              }`}
            >
              <span className="text-3xl">😡</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${overallScore === 1 ? 'text-red-600' : 'text-slate-400'}`}>Yomon</span>
            </button>

            <button 
              type="button"
              onClick={() => setOverallScore(2)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border-2 transition-all active:scale-95 cursor-pointer ${
                overallScore === 2 
                  ? 'bg-orange-50 border-orange-400 shadow-md scale-105' 
                  : 'bg-slate-50 border-transparent hover:bg-slate-100'
              }`}
            >
              <span className="text-3xl">🙁</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${overallScore === 2 ? 'text-orange-600' : 'text-slate-400'}`}>Qoniqarsiz</span>
            </button>

            <button 
              type="button"
              onClick={() => setOverallScore(3)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border-2 transition-all active:scale-95 cursor-pointer ${
                overallScore === 3 
                  ? 'bg-lime-50 border-lime-500 shadow-md scale-105' 
                  : 'bg-slate-50 border-transparent hover:bg-slate-100'
              }`}
            >
              <span className="text-3xl">🙂</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${overallScore === 3 ? 'text-lime-600' : 'text-slate-400'}`}>Yaxshi</span>
            </button>

            <button 
              type="button"
              onClick={() => setOverallScore(4)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border-2 transition-all active:scale-95 cursor-pointer ${
                overallScore === 4 
                  ? 'bg-[#0A9C54]/10 border-[#0A9C54] shadow-md scale-105' 
                  : 'bg-slate-50 border-transparent hover:bg-slate-100'
              }`}
            >
              <span className="text-3xl">😍</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${overallScore === 4 ? 'text-[#0A9C54]' : 'text-slate-400'}`}>A'lo</span>
            </button>
          </div>
        </div>

        {/* Dynamic Criteria UI */}
        {activeDeptData?.criteria && activeDeptData.criteria.length > 0 ? (
          <div className="space-y-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t.rateCriteria}
            </label>
            <div className="space-y-3">
              {activeDeptData.criteria.map((c: any) => {
                let optionsList: string[] = [];
                if (c.options) {
                  try {
                    const parsed = JSON.parse(c.options);
                    if (Array.isArray(parsed)) optionsList = parsed;
                  } catch (e) {}
                }

                // Agar Admin mezon uchun tugmalar kiritgan bo'lsa (Masalan: Kirmadi, 1 marta, 2+ marta)
                if (optionsList.length > 0) {
                  return (
                    <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                      <p className="text-[14px] font-extrabold text-slate-800 mb-3 leading-snug">{c.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {optionsList.map((opt: string, optIdx: number) => {
                          const isSelected = textAnswers[c.id] === opt;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => {
                                setTextAnswers(prev => ({ ...prev, [c.id]: opt }));
                                setRatings(prev => ({ ...prev, [c.id]: 5 })); // validation uchun
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-[#0A9C54] text-white border-[#0A9C54] shadow-md shadow-[#0A9C54]/20 scale-102'
                                  : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Agar variantlar bo'lmasa — Standart Ha/Yo'q tugmalar
                const defaultOptions = ['👍 Ha', '👎 Yo\'q'];
                return (
                  <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    <p className="text-[14px] font-extrabold text-slate-800 mb-3 leading-snug">{c.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {defaultOptions.map((opt: string, optIdx: number) => {
                        const isSelected = textAnswers[c.id] === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              setTextAnswers(prev => ({ ...prev, [c.id]: opt }));
                              setRatings(prev => ({ ...prev, [c.id]: optIdx === 0 ? 5 : 1 })); // validation uchun: Ha = 5, Yo'q = 1
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-[#0A9C54] text-white border-[#0A9C54] shadow-md shadow-[#0A9C54]/20 scale-102'
                                : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : isLoadingDepts ? (
          <div className="space-y-3 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#0A9C54] border-t-transparent animate-spin"></div>
              <span className="text-xs font-bold text-slate-500">
                {lang === 'uz' ? 'Mezonlar yuklanmoqda...' : 'Загрузка критериев...'}
              </span>
            </div>
            <div className="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>
            <div className="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>
          </div>
        ) : (
          <div className="text-center text-slate-400 text-sm py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
             Ushbu bo'lim uchun baholash mezonlari kiritilmagan.
          </div>
        )}

        {/* Comment Section with Voice Recording */}
        <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.commentLabel}</label>
              <span className="text-[11px] font-bold text-[#0A9C54]">yoki ovozli xabar</span>
            </div>
            <textarea 
              rows={3} 
              placeholder={getCommentPlaceholder(selectedDept)} 
              className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54] transition-all bg-slate-50/50 resize-none text-slate-800"
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
            ></textarea>

            {/* Voice Message Recorder Component */}
            <div className="mt-3">
              {!audioBlob ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <button 
                    type="button"
                    onClick={toggleRecording}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-[#0A9C54] text-white hover:bg-[#088246]'
                    }`}
                  >
                    {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={22} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      {isRecording ? "Ovoz yozilmoqda..." : "Ovozli xabar qoldirish"}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {isRecording ? formatTime(recordingTime) : "Tugmani bosib dardingizni gapiring"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                    <Mic size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-purple-900">Ovozli xabar tayyor ({formatTime(recordingTime)})</p>
                    <audio src={audioUrl!} controls className="w-full h-8 mt-1" />
                  </div>
                  <button 
                    type="button"
                    onClick={discardAudio}
                    className="w-9 h-9 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-colors shadow-xs"
                    title="O'chirish"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
            </div>
        </div>

        {/* Call Me Feature (Only shown if rated low) */}
        {hasLowRating && (
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 space-y-3">
            {!wantsCall ? (
              <button 
                type="button"
                onClick={() => setWantsCall(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm"
              >
                <Phone size={18} />
                {t.callMeText}
              </button>
            ) : (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.phonePlaceholder}</label>
                <input 
                  type="tel"
                  placeholder="+998"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-red-200 rounded-xl text-[14px] focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={!canSubmit || isSubmitting || (wantsCall && phone.trim().length < 9)}
          className={`w-full font-bold py-4 px-4 rounded-2xl transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 ${
            canSubmit && (!wantsCall || phone.trim().length >= 9)
              ? 'bg-[#0A9C54] hover:bg-[#088246] text-white shadow-[0_8px_20px_rgba(10,156,84,0.25)]' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </span>
          ) : t.submit}
        </button>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 w-full bg-slate-50">
      <Suspense fallback={<div className="max-w-md w-full bg-white p-8 rounded-[2rem] text-center"><h1 className="text-xl font-bold">...</h1></div>}>
        <RatingForm />
      </Suspense>
    </div>
  );
}
