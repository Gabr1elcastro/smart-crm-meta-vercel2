import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { followupService } from "@/services/followupService";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { clientesService } from "@/services/clientesService";
import { Link } from "react-router-dom";

export default function ConfigFollowup() {
  const { user } = useAuth();
  const [clienteInfo, setClienteInfo] = useState<any>(null);

  // Estados para os 3 followups
  const [primeiroAtivo, setPrimeiroAtivo] = useState(true);
  const [primeiroDias, setPrimeiroDias] = useState("1");
  const [primeiroMensagem, setPrimeiroMensagem] = useState("");
  const [primeiroAudio, setPrimeiroAudio] = useState(false);

  const [segundoAtivo, setSegundoAtivo] = useState(false);
  const [segundoDias, setSegundoDias] = useState("2");
  const [segundoMensagem, setSegundoMensagem] = useState("");
  const [segundoAudio, setSegundoAudio] = useState(false);

  const [terceiroAtivo, setTerceiroAtivo] = useState(false);
  const [terceiroDias, setTerceiroDias] = useState("3");
  const [terceiroMensagem, setTerceiroMensagem] = useState("");
  const [terceiroAudio, setTerceiroAudio] = useState(false);

  const [horaPreferencial, setHoraPreferencial] = useState("09:00");
  const [status, setStatus] = useState("ativo");
  const [startAutFollowup, setStartAutFollowup] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchCliente = async () => {
      const info = await clientesService.getClienteByIdCliente(user.id_cliente);
      setClienteInfo(info);
      // Carregar estado inicial do início automático
      if (info?.start_aut_followup !== undefined) {
        setStartAutFollowup(info.start_aut_followup);
      }
    };
    fetchCliente();
  }, [user]);

  useEffect(() => {
    if (!clienteInfo?.id) return;
    const carregarConfig = async () => {
      const config = await followupService.getByClientId(Number(clienteInfo.id));
      if (config) {
        setPrimeiroAtivo(!!config.primeiro_followup_status);
        setPrimeiroDias(String(config.primeiro_followup_dias));
        setPrimeiroMensagem(config.primeiro_followup_mensagem || "");
        setPrimeiroAudio(!!config.envio_audio_1);
        setSegundoAtivo(!!config.segundo_followup_status);
        setSegundoDias(String(config.segundo_followup_dias));
        setSegundoMensagem(config.segundo_followup_mensagem || "");
        setSegundoAudio(!!config.envio_audio_2);
        setTerceiroAtivo(!!config.terceiro_followup_status);
        setTerceiroDias(String(config.terceiro_followup_dias));
        setTerceiroMensagem(config.terceiro_followup_mensagem || "");
        setTerceiroAudio(!!config.envio_audio_3);
        setHoraPreferencial(config.horario_followup || "09:00");
        setStatus(config.status_followup === "Ativo" ? "ativo" : "pausado");
      }
    };
    carregarConfig();
  }, [clienteInfo]);

  const toggleStartAutFollowup = async () => {
    if (!user?.id) {
      toast.error("Usuário não identificado.");
      return;
    }
    
    try {
      const success = await clientesService.toggleStartAutFollowup(user.id);
      if (success) {
        setStartAutFollowup(!startAutFollowup);
        toast.success(`Início automático ${!startAutFollowup ? 'ativado' : 'desativado'} com sucesso!`);
      } else {
        toast.error("Erro ao alternar início automático");
      }
    } catch (error) {
      console.error("Erro ao alternar início automático:", error);
      toast.error("Erro ao alternar início automático");
    }
  };

  const togglePrimeiroAudio = async (checked: boolean) => {
    setPrimeiroAudio(checked);
    toast.success(`Envio de áudio da 1ª mensagem ${checked ? 'ativado' : 'desativado'}`);
    
    // Salvar imediatamente no banco
    if (clienteInfo?.id) {
      try {
        const config = {
          id_cliente: Number(clienteInfo.id),
          primeiro_followup_dias: Number(primeiroDias),
          primeiro_followup_mensagem: primeiroMensagem,
          primeiro_followup_status: primeiroAtivo,
          envio_audio_1: checked,
          segundo_followup_dias: Number(segundoDias),
          segundo_followup_mensagem: segundoMensagem,
          segundo_followup_status: segundoAtivo,
          envio_audio_2: segundoAudio,
          terceiro_followup_dias: Number(terceiroDias),
          terceiro_followup_mensagem: terceiroMensagem,
          terceiro_followup_status: terceiroAtivo,
          envio_audio_3: terceiroAudio,
          horario_followup: horaPreferencial.length === 5 ? horaPreferencial + ':00' : horaPreferencial,
          status_followup: status === "ativo" ? "Ativo" : "Pausado" as "Ativo" | "Pausado",
        };
        console.log("Salvando envio_audio_1:", checked);
        await followupService.upsert(config);
      } catch (error) {
        console.error("Erro ao salvar envio_audio_1:", error);
        toast.error("Erro ao salvar configuração de áudio");
      }
    }
  };

  const toggleSegundoAudio = async (checked: boolean) => {
    setSegundoAudio(checked);
    toast.success(`Envio de áudio da 2ª mensagem ${checked ? 'ativado' : 'desativado'}`);
    
    // Salvar imediatamente no banco
    if (clienteInfo?.id) {
      try {
        const config = {
          id_cliente: Number(clienteInfo.id),
          primeiro_followup_dias: Number(primeiroDias),
          primeiro_followup_mensagem: primeiroMensagem,
          primeiro_followup_status: primeiroAtivo,
          envio_audio_1: primeiroAudio,
          segundo_followup_dias: Number(segundoDias),
          segundo_followup_mensagem: segundoMensagem,
          segundo_followup_status: segundoAtivo,
          envio_audio_2: checked,
          terceiro_followup_dias: Number(terceiroDias),
          terceiro_followup_mensagem: terceiroMensagem,
          terceiro_followup_status: terceiroAtivo,
          envio_audio_3: terceiroAudio,
          horario_followup: horaPreferencial.length === 5 ? horaPreferencial + ':00' : horaPreferencial,
          status_followup: status === "ativo" ? "Ativo" : "Pausado" as "Ativo" | "Pausado",
        };
        console.log("Salvando envio_audio_2:", checked);
        await followupService.upsert(config);
      } catch (error) {
        console.error("Erro ao salvar envio_audio_2:", error);
        toast.error("Erro ao salvar configuração de áudio");
      }
    }
  };

  const toggleTerceiroAudio = async (checked: boolean) => {
    setTerceiroAudio(checked);
    toast.success(`Envio de áudio da 3ª mensagem ${checked ? 'ativado' : 'desativado'}`);
    
    // Salvar imediatamente no banco
    if (clienteInfo?.id) {
      try {
        const config = {
          id_cliente: Number(clienteInfo.id),
          primeiro_followup_dias: Number(primeiroDias),
          primeiro_followup_mensagem: primeiroMensagem,
          primeiro_followup_status: primeiroAtivo,
          envio_audio_1: primeiroAudio,
          segundo_followup_dias: Number(segundoDias),
          segundo_followup_mensagem: segundoMensagem,
          segundo_followup_status: segundoAtivo,
          envio_audio_2: segundoAudio,
          terceiro_followup_dias: Number(terceiroDias),
          terceiro_followup_mensagem: terceiroMensagem,
          terceiro_followup_status: terceiroAtivo,
          envio_audio_3: checked,
          horario_followup: horaPreferencial.length === 5 ? horaPreferencial + ':00' : horaPreferencial,
          status_followup: status === "ativo" ? "Ativo" : "Pausado" as "Ativo" | "Pausado",
        };
        console.log("Salvando envio_audio_3:", checked);
        await followupService.upsert(config);
      } catch (error) {
        console.error("Erro ao salvar envio_audio_3:", error);
        toast.error("Erro ao salvar configuração de áudio");
      }
    }
  };

  const salvarConfiguracao = async () => {
    if (!clienteInfo?.id) {
      toast.error("Cliente não identificado.");
      return;
    }
    try {
      const config = {
        id_cliente: Number(clienteInfo.id),
        primeiro_followup_dias: Number(primeiroDias),
        primeiro_followup_mensagem: primeiroMensagem,
        primeiro_followup_status: primeiroAtivo,
        envio_audio_1: primeiroAudio,
        segundo_followup_dias: Number(segundoDias),
        segundo_followup_mensagem: segundoMensagem,
        segundo_followup_status: segundoAtivo,
        envio_audio_2: segundoAudio,
        terceiro_followup_dias: Number(terceiroDias),
        terceiro_followup_mensagem: terceiroMensagem,
        terceiro_followup_status: terceiroAtivo,
        envio_audio_3: terceiroAudio,
        horario_followup: horaPreferencial.length === 5 ? horaPreferencial + ':00' : horaPreferencial,
        status_followup: status === "ativo" ? "Ativo" : "Pausado" as "Ativo" | "Pausado",
      };
      console.log("Configuração enviada para o Supabase:", config);
      console.log("Valores de áudio:", {
        envio_audio_1: primeiroAudio,
        envio_audio_2: segundoAudio,
        envio_audio_3: terceiroAudio
      });
      console.log("Tipos dos valores de áudio:", {
        envio_audio_1_type: typeof primeiroAudio,
        envio_audio_2_type: typeof segundoAudio,
        envio_audio_3_type: typeof terceiroAudio
      });
      await followupService.upsert(config);
      toast.success("Configuração salva com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configuração");
    }
  };

  return (
    <>
      {/* Drawer/Menu lateral para mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Fundo escuro para fechar o menu */}
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setMenuOpen(false)} />
          {/* Menu lateral */}
          <div className="relative w-64 max-w-full h-full bg-white shadow-lg flex flex-col p-6 animate-slide-in-left">
            <button className="self-end mb-4 p-2 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <nav className="flex flex-col gap-4">
              <Link to="/" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Dashboard</Link>

              <Link to="/conversations" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Conversas</Link>
              <Link to="/contatos" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Contatos</Link>
              <Link to="/chatbots" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Chatbots</Link>
              <Link to="/departamentos" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Departamentos</Link>
              <Link to="/followup" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Followup Automático</Link>
              <Link to="/settings" className="text-lg font-medium text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Configurações</Link>
            </nav>
          </div>
        </div>
      )}
      {/* Topo com botão de menu (apenas mobile) */}
      <div className="flex items-center gap-2 p-4 border-b bg-white md:hidden sticky top-0 z-40">
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-2 text-2xl font-semibold">Followup Automático</span>
      </div>
      <div className="p-6 h-screen overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Configuração de Follow-up Automático</h2>
        
        {/* Botão de Início Automático */}
        <Card className="max-w-xl mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Início Automático</h3>
                <p className="text-sm text-gray-600">
                  {startAutFollowup 
                    ? 'O follow-up automático está ativado e funcionando' 
                    : 'O follow-up automático está desativado'
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch 
                  checked={startAutFollowup} 
                  onCheckedChange={toggleStartAutFollowup}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:opacity-60"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-xl">
          <CardContent className="space-y-8 py-6">
            {/* 1ª Mensagem */}
            <div className="space-y-2 border-b pb-6">
              <div className="flex items-center gap-2 mb-2">
                <Switch 
                  id="primeiroAtivo" 
                  checked={primeiroAtivo} 
                  onCheckedChange={setPrimeiroAtivo}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:opacity-60"
                />
                <span className="font-semibold text-lg">1ª Mensagem</span>
                <div className="flex items-center gap-2 ml-4">
                  <Switch 
                    id="primeiroAudio" 
                    checked={primeiroAudio} 
                    onCheckedChange={togglePrimeiroAudio}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:opacity-60"
                  />
                  <Label htmlFor="primeiroAudio" className="text-sm font-medium text-gray-600">
                    Enviar mensagem em áudio
                  </Label>
                </div>
              </div>
              <Label htmlFor="primeiroMensagem">Mensagem</Label>
              <Textarea
                id="primeiroMensagem"
                value={primeiroMensagem}
                onChange={e => setPrimeiroMensagem(e.target.value)}
                placeholder="Mensagem do primeiro follow-up"
                className="min-h-[100px] max-h-[120px] resize-none"
                rows={4}
              />
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="primeiroDias">Tempo</Label>
                  <Input
                    id="primeiroDias"
                    type="number"
                    min={1}
                    value={primeiroDias}
                    onChange={e => setPrimeiroDias(e.target.value)}
                    placeholder="Dias até o 1º follow-up"
                  />
                </div>
                <div className="mb-2">Dias</div>
              </div>
            </div>
            {/* 2ª Mensagem */}
            <div className="space-y-2 border-b pb-6">
              <div className="flex items-center gap-2 mb-2">
                <Switch 
                  id="segundoAtivo" 
                  checked={segundoAtivo} 
                  onCheckedChange={setSegundoAtivo}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:opacity-60"
                />
                <span className="font-semibold text-lg">2ª Mensagem</span>
                <div className="flex items-center gap-2 ml-4">
                  <Switch 
                    id="segundoAudio" 
                    checked={segundoAudio} 
                    onCheckedChange={toggleSegundoAudio}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:opacity-60"
                  />
                  <Label htmlFor="segundoAudio" className="text-sm font-medium text-gray-600">
                    Enviar mensagem em áudio
                  </Label>
                </div>
              </div>
              <Label htmlFor="segundoMensagem">Mensagem</Label>
              <Textarea
                id="segundoMensagem"
                value={segundoMensagem}
                onChange={e => setSegundoMensagem(e.target.value)}
                placeholder="Mensagem do segundo follow-up"
                className="min-h-[100px] max-h-[120px] resize-none"
                rows={4}
              />
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="segundoDias">Tempo</Label>
                  <Input
                    id="segundoDias"
                    type="number"
                    min={1}
                    value={segundoDias}
                    onChange={e => setSegundoDias(e.target.value)}
                    placeholder="Dias após o 1º follow-up"
                  />
                </div>
                <div className="mb-2">Dias</div>
              </div>
            </div>
            {/* 3ª Mensagem */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Switch 
                  id="terceiroAtivo" 
                  checked={terceiroAtivo} 
                  onCheckedChange={setTerceiroAtivo}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:opacity-60"
                />
                <span className="font-semibold text-lg">3ª Mensagem</span>
                <div className="flex items-center gap-2 ml-4">
                  <Switch 
                    id="terceiroAudio" 
                    checked={terceiroAudio} 
                    onCheckedChange={toggleTerceiroAudio}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:opacity-60"
                  />
                  <Label htmlFor="terceiroAudio" className="text-sm font-medium text-gray-600">
                    Enviar mensagem em áudio
                  </Label>
                </div>
              </div>
              <Label htmlFor="terceiroMensagem">Mensagem</Label>
              <Textarea
                id="terceiroMensagem"
                value={terceiroMensagem}
                onChange={e => setTerceiroMensagem(e.target.value)}
                placeholder="Mensagem do terceiro follow-up"
                className="min-h-[100px] max-h-[120px] resize-none"
                rows={4}
              />
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="terceiroDias">Tempo</Label>
                  <Input
                    id="terceiroDias"
                    type="number"
                    min={1}
                    value={terceiroDias}
                    onChange={e => setTerceiroDias(e.target.value)}
                    placeholder="Dias após o 2º follow-up"
                  />
                </div>
                <div className="mb-2">Dias</div>
              </div>
            </div>
            {/* Horário e status geral */}
            <div className="space-y-2 pt-6">
              <Label htmlFor="horaPreferencial">Hora preferencial de envio</Label>
              <Input
                id="horaPreferencial"
                type="time"
                value={horaPreferencial}
                onChange={e => setHoraPreferencial(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Tabs defaultValue={status} onValueChange={setStatus}>
                <TabsList>
                  <TabsTrigger value="ativo">Ativo</TabsTrigger>
                  <TabsTrigger value="pausado">Pausado</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <Button onClick={salvarConfiguracao}>Salvar Configuração</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 