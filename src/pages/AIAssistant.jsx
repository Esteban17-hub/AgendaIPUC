import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Send, User, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import './AIAssistant.css';

const AIAssistant = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '¡Hola! Soy tu Asistente IA de la Agenda IPUC. 🤖✨\nPuedes decirme por ejemplo:\n- "Agendar culto evangelístico el 25 de agosto a las 7pm en el templo"\n- "¿Qué eventos tenemos este mes?"\n- "Agendar ayuno este sábado sin hora fuera del templo"\n\n¿En qué te puedo colaborar hoy?'
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
      // Analizar si el mensaje es una instrucción para agendar evento
      const lower = text.toLowerCase();
      
      if (lower.includes('agendar') || lower.includes('crear') || lower.includes('programar')) {
        await handleAutoSchedule(text);
      } else if (lower.includes('eventos') || lower.includes('que hay') || lower.includes('programacion')) {
        await handleQueryEvents();
      } else {
        // Respuesta general del asistente
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `Entendido. He procesado tu solicitud sobre: "${text}".\nPara agendar automáticamente un evento en la base de datos, intenta usar una frase como: "Agendar Culto Misionero el 20 de septiembre a las 6pm en el templo".`
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
          text: 'Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSchedule = async (input) => {
    if (!profile?.congregation_id) {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: 'bot', text: 'Error: No se encontró tu congregación asignada.' }
      ]);
      return;
    }

    // Extraer datos usando patrones sencillos de Lenguaje Natural
    let name = 'Actividad Congregacional';
    let date = new Date().toISOString().split('T')[0];
    let time = '19:00:00';
    let location = input.toLowerCase().includes('fuera') ? 'Fuera del Templo' : 'En el Templo';
    let committee_id = committees[0]?.id || null;

    // Intentar extraer el nombre del evento
    const matchName = input.match(/(?:agendar|crear|programar)\s+(?:el|la|un|una)?\s*([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)(?=\s+(?:el|la|para|a|en)\s+\d|\s+el\s+\d|\s+a\s+las|$)/i);
    if (matchName && matchName[1]) {
      name = matchName[1].trim();
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Extraer fecha en formato YYYY-MM-DD o DD de mes
    const matchDate = input.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)(?:\s+de\s+(\d{4}))?/i);
    if (matchDate) {
      const day = parseInt(matchDate[1], 10);
      const monthStr = matchDate[2].toLowerCase();
      const year = matchDate[3] ? parseInt(matchDate[3], 10) : new Date().getFullYear();
      
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const monthIdx = monthNames.findIndex(m => m.startsWith(monthStr.slice(0, 3)));
      
      if (monthIdx !== -1) {
        const mm = String(monthIdx + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        date = `${year}-${mm}-${dd}`;
      }
    }

    // Extraer hora
    const matchTime = input.match(/(\d{1,2})\s*(?::\s*(\d{2}))?\s*(am|pm)?/i);
    if (matchTime) {
      let hour = parseInt(matchTime[1], 10);
      const minutes = matchTime[2] ? matchTime[2] : '00';
      const ampm = matchTime[3] ? matchTime[3].toLowerCase() : '';
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      time = `${String(hour).padStart(2, '0')}:${minutes}:00`;
    }

    if (input.toLowerCase().includes('sin hora') || input.toLowerCase().includes('todo el dia')) {
      time = '00:00:00';
    }

    // Insertar evento en la base de datos de Supabase
    const payload = {
      name,
      date,
      time,
      location,
      committee_id,
      congregation_id: profile.congregation_id
    };

    const { data: newEvt, error } = await supabase.from('events').insert([payload]).select().single();

    if (error) {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: 'bot', text: `No pude agendar el evento: ${error.message}` }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text: `¡Evento agendado exitosamente con IA! 🎉\n\n📌 **Nombre:** ${newEvt.name}\n📅 **Fecha:** ${newEvt.date}\n⏰ **Hora:** ${newEvt.time === '00:00:00' ? 'Todo el día' : newEvt.time.substring(0, 5)}\n📍 **Lugar:** ${newEvt.location}\n\nYa puedes verlo en tu Agenda y Calendario.`
        }
      ]);
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
        { id: Date.now(), sender: 'bot', text: 'No tienes eventos próximos registrados en la agenda.' }
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
    <div className="ai-assistant-page">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles color="var(--color-secondary)" /> Asistente Inteligente IA IPUC
        </h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>
          Escribe órdenes en lenguaje natural para agendar eventos o consultar tu programación automáticamente.
        </p>
      </div>

      <div className="suggestion-pills">
        <button className="suggestion-pill-btn" onClick={() => handleSendMessage('Agendar Culto Evangelístico el 25 de agosto a las 7pm en el templo')}>
          + Agendar Culto el 25 de Agosto
        </button>
        <button className="suggestion-pill-btn" onClick={() => handleSendMessage('Agendar Ayuno Congregacional el próximo sábado sin hora fuera del templo')}>
          + Agendar Ayuno sin hora
        </button>
        <button className="suggestion-pill-btn" onClick={() => handleSendMessage('¿Qué eventos tenemos en la agenda?')}>
          🔍 Consultar próximos eventos
        </button>
      </div>

      <div className="ai-chat-container glass-card">
        <div className="ai-chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-message ${msg.sender}`}>
              <div className={`chat-avatar ${msg.sender}`}>
                {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
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
            placeholder="Ej. Agendar culto de jóvenes el 18 de septiembre a las 6pm..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !inputText.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Send size={18} /> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
