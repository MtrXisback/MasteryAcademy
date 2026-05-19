package com.proyecto.cursos.service;

import com.proyecto.cursos.model.User;
import com.proyecto.cursos.model.Course;
import com.proyecto.cursos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AICopilotService {

    private final UserRepository userRepository;

    public String generateResponse(String username, String message, Double balance, List<Map<String, Object>> positions, Long courseId) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return "### ⚠️ Error del Sistema\nNo se pudo encontrar tu perfil de estudiante en la base de datos.";
        }

        User user = userOpt.get();
        String studentName = user.getFullName() != null ? user.getFullName() : user.getUsername();
        int level = user.getLevel();
        int xp = user.getXp();

        // Enrolled courses titles
        String coursesListStr = user.getEnrolledCourses().stream()
                .map(Course::getTitle)
                .collect(Collectors.joining(", "));
        if (coursesListStr.isEmpty()) {
            coursesListStr = "Ninguno por ahora (¡inscríbete en un programa desde el Inicio!)";
        }

        String msgLower = message.toLowerCase();

        // 1. CONTEXT: SIMULATOR & PORTFOLIO ANALYSIS
        if (msgLower.contains("simul") || msgLower.contains("operac") || msgLower.contains("portafol") 
                || msgLower.contains("posici") || msgLower.contains("balance") || msgLower.contains("ganan") 
                || msgLower.contains("perdi") || msgLower.contains("pnl") || msgLower.contains("bille")) {
            
            StringBuilder response = new StringBuilder();
            response.append("### 📊 Reporte de Portafolio del Mentor AI\n");
            response.append("Hola **").append(studentName).append("**. He revisado en tiempo real tu actividad en el **Simulador de Trading Glassmorphic**:\n\n");
            response.append("- **Balance de Efectivo**: `$").append(String.format("%,.2f", balance != null ? balance : 10000.0)).append(" USD`\n");
            
            double totalPnL = 0.0;
            if (positions != null && !positions.isEmpty()) {
                response.append("- **Posiciones Abiertas**: ").append(positions.size()).append(" activos en mercado.\n\n");
                response.append("#### 🔍 Detalle de Operaciones Activas:\n");
                
                for (Map<String, Object> pos : positions) {
                    String symbol = (String) pos.get("symbol");
                    String type = (String) pos.get("type");
                    Object sizeObj = pos.get("size");
                    Object entryPriceObj = pos.get("entryPrice");
                    Object currentPriceObj = pos.get("currentPrice");
                    Object pnlObj = pos.get("pnl");
                    
                    double pnl = pnlObj instanceof Number ? ((Number) pnlObj).doubleValue() : 0.0;
                    totalPnL += pnl;

                    response.append("🔹 **").append(symbol).append("** | **")
                            .append(type).append("** | Tamaño: `")
                            .append(sizeObj).append("` | Entrada: `")
                            .append(entryPriceObj).append("` | Actual: `")
                            .append(currentPriceObj).append("` | P&L: <span class=\"")
                            .append(pnl >= 0 ? "success" : "fail").append("\">**")
                            .append(pnl >= 0 ? "+" : "").append(String.format("$%,.2f", pnl))
                            .append(" USD**</span>\n");
                }
                
                response.append("\n#### 🧠 Diagnóstico Institucional:\n");
                double marginUsed = totalPnL; // Mock calculation
                
                if (totalPnL >= 0) {
                    response.append("🏆 **¡Excelente ejecución, Trader!** Tus operaciones flotantes están en territorio verde con un P&L de **+$")
                            .append(String.format("%,.2f", totalPnL)).append(" USD**. Estás demostrando una paciencia admirable. Recuerda aplicar la regla de **'dejar correr las ganancias y cortar las pérdidas rápido'**. No olvides asegurar beneficios parciales si se acercan a zonas de liquidez clave.");
                } else {
                    response.append("⚠️ **Alerta de Gestión de Riesgo**: Actualmente tienes un flotante negativo de **$")
                            .append(String.format("%,.2f", totalPnL)).append(" USD**. En trading, las pérdidas son un costo operativo del negocio. Lo importante es controlar tu apalancamiento (1:10) y validar que no estés comprometiendo más del **1% al 2%** de tu cuenta en una sola idea. ¿Están claros tus niveles de Stop Loss?");
                }
            } else {
                response.append("- **Posiciones Abiertas**: `Ninguna`\n\n");
                response.append("#### 🧠 Diagnóstico Institucional:\n");
                response.append("Actualmente estás en **100% liquidez** (en efectivo). Esta es una posición muy sabia cuando el mercado no presenta patrones claros. Recuerda que no operar también es operar. Te sugiero revisar el gráfico fluctuante de **BTC/USD** o **Oro (XAU/USD)** en el Simulador y buscar un patrón de rompimiento de estructura o un retroceso al 50% de Fibonacci para abrir tu primera operación de bajo riesgo.");
            }
            
            response.append("\n\n*Mantén la disciplina. Tu Rango actual es **").append(getRankTitle(level)).append("** (Nivel ").append(level).append(").*");
            return response.toString();
        }

        // 2. CONTEXT: ASSET SPECIFIC COMMENTARY
        if (msgLower.contains("btc") || msgLower.contains("bitcoin")) {
            return "### 🪙 Análisis Técnico de Élite: Bitcoin (BTC/USD)\n" +
                    "Hola **" + studentName + "**. Como mentor de la academia, veo a **Bitcoin** en un escenario fascinante:\n\n" +
                    "1. **Estructura de Mercado**: BTC está consolidando liquidez justo por encima del bloque de ordenes alcista (Order Block) diario. Si observas el Simulador, las micro-fluctuaciones muestran compresión de precio.\n" +
                    "2. **Estrategia**: Buscamos compras únicamente si el precio realiza un *Market Structure Shift* (cambio de estructura) en temporalidades menores tras barrer los mínimos anteriores.\n" +
                    "3. **Consejo del Mentor**: Si decides abrir un **LONG** en el simulador, hazlo con un tamaño de posición conservador (ej: `0.05` a `0.1` unidades) para tolerar el ruido del mercado sin sufrir llamadas de margen.\n\n" +
                    "*¿Quieres que analicemos algún patrón de velas específico?*";
        }
        
        if (msgLower.contains("eth") || msgLower.contains("ethereum")) {
            return "### 🔮 Proyección Institucional: Ethereum (ETH/USD)\n" +
                    "Hola **" + studentName + "**. Ethereum está demostrando una correlación estrecha con BTC, pero con mayor volatilidad:\n\n" +
                    "- **Zona de Interés**: Hay una ineficiencia en el precio (Fair Value Gap) justo debajo de las cotizaciones actuales.\n" +
                    "- **Táctica**: Esperar que llene la ineficiencia en el simulador antes de buscar una entrada en compras. Si rompe el soporte clave con fuerza, el sesgo cambiará a ventas rápidas (Shorts).\n\n" +
                    "*Recuerda que con apalancamiento 1:10, los movimientos rápidos de ETH pueden multiplicar tu balance virtual o recortarlo. ¡Sé paciente!*";
        }

        if (msgLower.contains("oro") || msgLower.contains("xau")) {
            return "### 🔱 Safe Haven Report: Oro (XAU/USD)\n" +
                    "El metal precioso por excelencia, **XAU/USD**, está reaccionando como zona de refugio financiero:\n\n" +
                    "- **Lectura de Gráfico**: Estamos viendo compras institucionales sostenidas. En el simulador, el precio se mantiene sólido.\n" +
                    "- **Estrategia recomendada**: Las compras (Long) en los retrocesos a medias móviles de corto plazo suelen ser de alta probabilidad en tendencias fuertes como esta.\n\n" +
                    "*Es una excelente cobertura para tu portafolio simulado. ¡Intenta colocar una pequeña orden en compras!*";
        }

        if (msgLower.contains("tsla") || msgLower.contains("tesla")) {
            return "### ⚡ Análisis de Acciones: Tesla Inc. (TSLA)\n" +
                    "TSLA es el activo más agresivo en nuestra lista de acciones:\n\n" +
                    "- **Comportamiento**: Muy sensible a noticias de desarrollo tecnológico y balances trimestrales. Sus fluctuaciones en el simulador superan el 1% diario habitualmente.\n" +
                    "- **Recomendación**: Operar solo con apalancamiento sumamente bajo. Su volatilidad puede barrer cuentas descuidadas.";
        }

        // 3. CONTEXT: COURSES & ACADEMIC HELP
        if (msgLower.contains("curso") || msgLower.contains("estud") || msgLower.contains("lecc") 
                || msgLower.contains("aprend") || msgLower.contains("spring") || msgLower.contains("angular") 
                || msgLower.contains("api") || msgLower.contains("velas") || msgLower.contains("apalan") 
                || msgLower.contains("indicad") || msgLower.contains("soporte") || msgLower.contains("resisten")) {
            
            return "### 🎓 Tutoría Académica Personalizada\n" +
                    "Estimado **" + studentName + "**, veo que actualmente estás progresando en tu camino hacia el éxito con los siguientes programas de la academia:\n" +
                    "👉 **" + coursesListStr + "**\n\n" +
                    "#### 💡 Explicación Magistral:\n" +
                    "El concepto que mencionas es piedra angular en nuestro currículum. Permíteme desglosarlo brevemente:\n\n" +
                    "1. **Soportes y Resistencias**: Son áreas psicológicas donde interactúan la oferta y la demanda. En la programación backend, esto equivale a tus límites de tasa de petición (Rate Limiting) o controles de seguridad en controladores para evitar sobrecargas.\n" +
                    "2. **Apalancamiento (Leverage)**: Permite multiplicar tu capital operativo. En Mastery Academy usamos apalancamiento virtual de `1:10` en el simulador. Esto significa que por cada `$100` de margen retenido, controlas `$1,000` de valor en el mercado.\n" +
                    "3. **Sincronización Tecnológica**: Al igual que el backend procesa las transacciones financieras de forma asíncrona, nuestro frontend en Angular refleja en tiempo real el progreso de tu XP mediante inyecciones dinámicas de servicios asíncronos (`Observable`).\n\n" +
                    "*¿Tienes alguna duda de código o de trading que quieras resolver con un ejemplo práctico?*";
        }

        // 4. CONTEXT: TRADING PSYCHOLOGY
        if (msgLower.contains("psicol") || msgLower.contains("miedo") || msgLower.contains("emoc") 
                || msgLower.contains("discip") || msgLower.contains("pacienc") || msgLower.contains("ansie") 
                || msgLower.contains("perder")) {
            
            return "### 🧠 Psicología de Trading & Mindset de Élite\n" +
                    "Hola **" + studentName + "**. La técnica representa solo el 20% del éxito; el 80% restante es psicología, autocontrol y manejo emocional.\n\n" +
                    "#### 📝 Reglas de Oro del Mindset Institucional:\n" +
                    "1. **Acepta el Riesgo**: Antes de dar clic en 'Comprar' o 'Vender' en el Simulador, debes aceptar mentalmente que esa orden puede perder. Si sientes ansiedad, el tamaño de tu posición es demasiado grande.\n" +
                    "2. **El Negocio de las Probabilidades**: El trading no se trata de tener la razón en cada operación. Se trata de tener una ventaja estadística a largo plazo y un ratio de riesgo/beneficio favorable (mínimo 1:2).\n" +
                    "3. **Evita el Overtrading (Operar de más)**: La codicia de recuperar pérdidas rápido te llevará a cometer errores. Define una pérdida diaria máxima y si la alcanzas, apaga la pantalla y sal a caminar.\n\n" +
                    "*Estás en el Nivel " + level + " con " + xp + " XP. El camino del trader es una maratón de disciplina, no una carrera de velocidad. ¡Sigue adelante!*";
        }

        // 5. DEFAULT WELCOME & HELP
        return "### 🤖 ¡Saludos, Trader de Élite!\n" +
                "Soy tu **Mastery Mentor AI**, tu copiloto de Inteligencia Artificial para trading institucional y tecnología avanzada de la academia.\n\n" +
                "Tengo acceso a tu ficha de estudiante en tiempo real. Veo que eres **" + studentName + "**, posees el rango de **" + getRankTitle(level) + "** (Nivel " + level + " con " + xp + " XP) y estás matriculado en los cursos de: *" + coursesListStr + "*.\n\n" +
                "#### 💬 ¿En qué te puedo ayudar hoy?\n" +
                "- **Analizar tu simulador**: Pregúntame *'¿cómo va mi portafolio?'* o *'analiza mis posiciones'* y te daré un diagnóstico financiero completo de tus operaciones en tiempo real.\n" +
                "- **Estrategias sobre activos**: Escribe *'¿qué opinas de BTC?'* u *'Oro'* para ver mis lecturas institucionales.\n" +
                "- **Dudas de tus Cursos**: Pregúntame sobre cualquier concepto de programación o trading de tus clases.\n" +
                "- **Dominio Mental**: Pídeme consejos para controlar las emociones y la disciplina de mercado.\n\n" +
                "*Escribe tu duda y operemos como profesionales. ⚡*";
    }

    private String getRankTitle(int level) {
        if (level <= 2) return "Trader Aspirante";
        if (level <= 5) return "Trader Institucional";
        if (level <= 9) return "Gestor de Fondos";
        return "Socio Fundeado";
    }
}
