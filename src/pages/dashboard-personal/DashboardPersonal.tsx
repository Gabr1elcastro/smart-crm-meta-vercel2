import React from "react";
import { useAuth } from "@/contexts/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { dashboardPersonalService } from "@/services/dashboardPersonalService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { format, endOfDay, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, RefreshCw } from "lucide-react";
import { formatLeadValor } from "@/utils/currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

function defaultDateRange(): DateRange {
  const today = new Date();
  return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
}

export default function DashboardPersonal() {
  const { user } = useAuth();
  const { permissions, loading: permissionsLoading } = usePermissions();

  const [dateRange, setDateRange] = React.useState<DateRange>(defaultDateRange());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [minhasVendas, setMinhasVendas] = React.useState<Awaited<
    ReturnType<typeof dashboardPersonalService.getMinhasVendas>
  > | null>(null);

  const [minhasOportunidades, setMinhasOportunidades] = React.useState<Awaited<
    ReturnType<typeof dashboardPersonalService.getMinhasOportunidades>
  > | null>(null);

  const idCliente = user?.id_cliente ?? null;
  const email = user?.email ?? null;

  const allowedDepartments = React.useMemo(() => {
    if (!permissions) return [];
    return permissions.canViewAllDepartments ? [] : permissions.allowedDepartments;
  }, [permissions]);

  const load = React.useCallback(async () => {
    if (!idCliente || !email) return;
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    setError(null);
    try {
      const [vendas, oportunidades] = await Promise.all([
        dashboardPersonalService.getMinhasVendas({
          idCliente,
          email,
          from: startOfDay(dateRange.from),
          to: endOfDay(dateRange.to),
        }),
        dashboardPersonalService.getMinhasOportunidades({
          idCliente,
          allowedDepartments,
        }),
      ]);

      setMinhasVendas(vendas);
      setMinhasOportunidades(oportunidades);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados do dashboard");
      setMinhasVendas({ rows: [], total: 0 });
      setMinhasOportunidades({ rows: [], totalOportunidades: 0, totalValor: 0, insights: [] });
    } finally {
      setLoading(false);
    }
  }, [idCliente, email, dateRange?.from, dateRange?.to, allowedDepartments]);

  React.useEffect(() => {
    if (permissionsLoading) return;
    load();
  }, [permissionsLoading, load]);

  const totalVendas = minhasVendas?.total ?? 0;
  const totalOportunidadesValor = minhasOportunidades?.totalValor ?? 0;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Resumo das suas vendas e oportunidades</p>
          {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
        </div>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy", { locale: ptBR })
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(r) => r && setDateRange(r as DateRange)}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={load} disabled={loading || permissionsLoading || !idCliente}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Valor total das vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{formatLeadValor(totalVendas)}</div>
            <p className="text-sm text-gray-600 mt-1">
              {minhasVendas?.rows.length ?? 0} vendas no período selecionado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Valor total das oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatLeadValor(totalOportunidadesValor)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {minhasOportunidades?.totalOportunidades ?? 0} oportunidades acessíveis
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Minhas vendas</CardTitle>
            <Badge variant="secondary">{minhasVendas?.rows.length ?? 0}</Badge>
          </div>
          <p className="text-sm text-gray-600">Filtrado pelo período acima</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data da venda</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Conversa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(minhasVendas?.rows || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    Nenhuma venda encontrada no período.
                  </TableCell>
                </TableRow>
              ) : (
                (minhasVendas?.rows || []).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.nome}</TableCell>
                    <TableCell>
                      {v.data_venda ? format(new Date(v.data_venda), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatLeadValor(v.valor)}</TableCell>
                    <TableCell className="text-right">
                      {v.telefone ? (
                        <div className="flex justify-end">
                          <Link to={`/conversations?phone=${encodeURIComponent(v.telefone)}`}>
                            <Button size="sm" variant="outline">Acessar conversa</Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <span className="text-xs text-gray-400">Sem telefone</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Minhas oportunidades</CardTitle>
              <Badge variant="secondary">{minhasOportunidades?.rows.length ?? 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Conversa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(minhasOportunidades?.rows || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Nenhuma oportunidade encontrada (etiqueta “Oportunidade”).
                    </TableCell>
                  </TableRow>
                ) : (
                  (minhasOportunidades?.rows || []).slice(0, 20).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.nome}</TableCell>
                      <TableCell>
                        {o.data_criacao ? format(new Date(o.data_criacao), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </TableCell>
                      <TableCell className="text-right">{formatLeadValor(o.valor)}</TableCell>
                      <TableCell className="text-right">
                        {o.telefone ? (
                          <div className="flex justify-end">
                            <Link to={`/conversations?phone=${encodeURIComponent(o.telefone)}`}>
                              <Button size="sm" variant="outline">Acessar conversa</Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <span className="text-xs text-gray-400">Sem telefone</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {(minhasOportunidades?.rows?.length ?? 0) > 20 ? (
              <p className="text-xs text-gray-500 mt-3">Mostrando 20 de {minhasOportunidades?.rows.length}.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Insights (oportunidades)</CardTitle>
              <Badge variant="secondary">{minhasOportunidades?.insights.length ?? 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {(minhasOportunidades?.insights || []).length === 0 ? (
                <div className="text-center text-gray-500 text-sm">Nenhum insight encontrado nas oportunidades.</div>
              ) : (
                (minhasOportunidades?.insights || []).slice(0, 15).map((i) => (
                  <div key={i.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{i.nome}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {i.data_criacao ? format(new Date(i.data_criacao), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Insight</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words">
                      {String(i.insight || "").trim()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

