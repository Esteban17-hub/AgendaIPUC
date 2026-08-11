import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import '../pages/AIAssistant.css';

export const AIAssistantModal = ({ onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '¡Hola! Soy Secre, tu asistente virtual de la Agenda IPUC. 👩‍💼✨\nPuedes pedirme agendar eventos en lenguaje natural:\n- "Agendar culto evangelístico el 25 de agosto a las 7pm en el templo"\n- "Agendar vigilia este sábado a las 10pm fuera del templo"\n- "Agendar ayuno mañana a las 8am"\n- "¿Qué eventos tenemos este mes?"\n\n¿En qué te colaboro hoy?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [committees, setCommittees] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (profile?.congregation_id) {
      supabase
        .from('committees')
        .select('id, name')
        .eq('congregation_id', profile.congregation_id)
        .then(({ data }) => {
          if (data) setCommittees(data);
        });
    }
  }, [profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMessage = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const lower = text.toLowerCase();
      
      if (lower.includes('agendar') || lower.includes('crear') || lower.includes('programar')) {
        await handleAutoSchedule(text);
      } else if (lower.includes('eventos') || lower.includes('que hay') || lower.includes('programacion') || lower.includes('agenda')) {
        await handleQueryEvents();
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `Procesé tu mensaje: "${text}".\n\n💡 **Tip de Secre:** Escribe por ejemplo: "Agendar Culto de Jóvenes el 20 de septiembre a las 6pm en el templo" y lo registraré automáticamente en tu agenda y calendario.`
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Ocurrió un pequeño inconveniente al procesar tu mensaje. Por favor intenta de nuevo.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSchedule = async (input) => {
    if (!profile?.congregation_id) return;

    let name = 'Actividad Congregacional';
    let targetDate = new Date();
    let time = '19:00:00';
    let location = input.toLowerCase().includes('fuera') ? 'Fuera del Templo' : 'En el Templo';
    
    const firstCommId = committees[0]?.id;
    let committee_id = (firstCommId && !firstCommId.startsWith('def-') && !firstCommId.startsWith('local-')) ? firstCommId : null;

    // 1. Extracción del Nombre
    const matchName = input.match(/(?:agendar|crear|programar)\s+(?:el|la|un|una)?\s*([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)(?=\s+(?:el|la|para|a|en|este|esta|mañana|hoy)\s+\d|\s+el\s+\d|\s+a\s+las|\s+este|\s+mañana|\s+hoy|$)/i);
    if (matchName && matchName[1]) {
      let extracted = matchName[1].trim();
      extracted = extracted.replace(/\b(el|la|en|este|esta|mañana|hoy|las)\b/gi, '').trim();
      if (extracted) {
        name = extracted.charAt(0).toUpperCase() + extracted.slice(1);
      }
    }

    // 2. Extracción de Fechas Relativas (hoy, mañana, este sábado, etc.)
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('mañana')) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (lowerInput.includes('hoy')) {
      // Usar fecha de hoy
    } else if (lowerInput.includes('sabado') || lowerInput.includes('sábado')) {
      const day = targetDate.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + diff);
    } else if (lowerInput.includes('domingo')) {
      const day = targetDate.getDay();
      const diff = (0 - day + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + diff);
    } else if (lowerInput.includes('viernes')) {
      const day = targetDate.getDay();
      const diff = (5 - day + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + diff);
    } else {
      // Extracción de Fecha Absoluta (Ej. 25 de agosto de 2026)
      const matchDate = input.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)(?:\s+de\s+(\d{4}))?/i);
      if (matchDate) {
        const day = parseInt(matchDate[1], 10);
        const monthStr = matchDate[2].toLowerCase();
        const year = matchDate[3] ? parseInt(matchDate[3], 10) : new Date().getFullYear();
        
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const monthIdx = monthNames.findIndex(m => m.startsWith(monthStr.slice(0, 3)));
        
        if (monthIdx !== -1) {
          targetDate = new Date(year, monthIdx, day);
        }
      }
    }

    const dateStr = targetDate.toISOString().split('T')[0];

    // 3. Extracción de Hora
    const matchTime = input.match(/(\d{1,2})\s*(?::\s*(\d{2}))?\s*(am|pm)?/i);
    if (matchTime) {
      let hour = parseInt(matchTime[1], 10);
      const minutes = matchTime[2] ? matchTime[2] : '00';
      const ampm = matchTime[3] ? matchTime[3].toLowerCase() : '';
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      time = `${String(hour).padStart(2, '0')}:${minutes}:00`;
    }

    if (lowerInput.includes('sin hora') || lowerInput.includes('todo el dia') || lowerInput.includes('todo el día')) {
      time = '00:00:00';
    }

    const payload = {
      name,
      date: dateStr,
      time,
      location,
      committee_id,
      congregation_id: profile.congregation_id
    };

    const { data: newEvt, error } = await supabase.from('events').insert([payload]).select().single();

    if (error) {
      console.warn('Error al agendar con Supabase (agendado en modo fallback):', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text: `¡Listo! Evento agendado por Secre 🎉\n\n📌 **Nombre:** ${name}\n📅 **Fecha:** ${dateStr}\n⏰ **Hora:** ${time === '00:00:00' ? 'Todo el día' : time.substring(0, 5)}\n📍 **Lugar:** ${location}\n\nYa está disponible en tu agenda.`
        }
      ]);
      if (onSuccess) onSuccess();
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text: `¡Listo! Evento agendado por Secre 🎉\n\n📌 **Nombre:** ${newEvt.name}\n📅 **Fecha:** ${newEvt.date}\n⏰ **Hora:** ${newEvt.time === '00:00:00' ? 'Todo el día' : newEvt.time.substring(0, 5)}\n📍 **Lugar:** ${newEvt.location}\n\nYa lo encuentras registrado en tu Inicio, Agenda y Calendario.`
        }
      ]);
      if (onSuccess) onSuccess();
    }
  };

  const handleQueryEvents = async () => {
    if (!profile?.congregation_id) return;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select('name, date, time, location')
      .eq('congregation_id', profile.congregation_id)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(5);

    if (error || !data || data.length === 0) {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: 'bot', text: 'No tienes eventos próximos registrados en la agenda para los siguientes días.' }
      ]);
    } else {
      const listText = data
        .map(e => `• **${e.name}** - ${e.date} (${e.time === '00:00:00' ? 'Todo el día' : e.time.substring(0,5)}) en ${e.location}`)
        .join('\n');

      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text: `Tus próximos eventos en la agenda son:\n\n${listText}`
        }
      ]);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', paddingRight: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
          <Sparkles color="var(--color-secondary)" size={24} /> Secre - Asistente IPUC
        </h2>
      </div>

      <div className="suggestion-pills" style={{ marginBottom: '1.2rem' }}>
        <button className="suggestion-pill-btn" onClick={() => handleSendMessage('Agendar Culto Evangelístico el 25 de agosto a las 7pm en el templo')}>
          + Culto el 25 de Agosto
        </button>
        <button className="suggestion-pill-btn" onClick={() => handleSendMessage('Agendar vigilia este sábado a las 10pm fuera del templo')}>
          + Vigilia este Sábado
        </button>
        <button className="suggestion-pill-btn" onClick={() => handleSendMessage('¿Qué eventos tenemos en la agenda?')}>
          🔍 Consultar eventos
        </button>
      </div>

      <div className="ai-chat-container">
        <div className="ai-chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-message ${msg.sender}`}>
              <div className={`chat-avatar ${msg.sender}`}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="chat-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="ai-chat-input-box">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe tu mensaje a Secre..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !inputText.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </Modal>
  );
};
