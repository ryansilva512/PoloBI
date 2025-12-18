const fs=require('fs');
const path='client/src/pages/home.tsx';
let text=fs.readFileSync(path,'utf8');
const old=        <Card className="bg-card/70 border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-foreground/80" />
              MÇ¸dia das Notas (estimada via conformidade)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono">
                {mediaEstimadaNotas.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
            {renderStars()}
            <p className="text-sm text-muted-foreground">
              Calculado a partir da conformidade de SLA (em dia vs. total).
            </p>
          </CardContent>
        </Card>;
const neu=        <Card className="bg-card/70 border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-foreground/80" />
              Top 4 Operadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topOperadores.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            )}
            {topOperadores.map((op, idx) => {
              const avatarSrc = getAvatarSrc(op.nome);
              return (
                <div
                  key={op.nome}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-semibold text-muted-foreground">#{idx + 1}</div>
                    <Avatar className="h-10 w-10">
                      {avatarSrc ? <AvatarImage src={avatarSrc} alt={op.nome} /> : null}
                      <AvatarFallback>{op.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold leading-tight">{op.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {op.total} chamados • {op.mediaDiaria.toFixed(2)} / dia
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>;
if(!text.includes(old)) { console.error('old block not found'); process.exit(1);} 
text=text.replace(old,neu); fs.writeFileSync(path,text);
