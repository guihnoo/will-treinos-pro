const fs = require('fs');
const path = 'C:\\Users\\monte\\Desktop\\will-treinos-pro\\src\\components\\will\\WillCockpit.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. FIX MODAL SCROLL PHYSICS:
// Convert all overlays from "flex items-end overflow-hidden" to "overflow-y-auto"
code = code.replace(/className=\"fixed inset-0 z-\[(\d+)\] flex items-end justify-center overflow-hidden bg-black\/7[05] p-3 sm:items-center sm:p-6\"/g, 
  'className="fixed inset-0 z-[$1] overflow-y-auto bg-black/80"');

// Wrap motion.section in the correct flex container for proper overlay scrolling
code = code.replace(/<motion\.section([\s\S]*?)className=\"[^\"]*flex max-h-\[calc\(100dvh-1\.5rem\)\][^\"]*w-full max-w-([^ ]+)[^\"]*\"([\s\S]*?)>/g, 
  '<div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6"><motion.section$1className="w-full max-w-$2 transform overflow-hidden rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 text-left shadow-2xl backdrop-blur-3xl"$3>');

code = code.replace(/<\/motion\.section>/g, '</motion.section></div>');

// Remove the inner overflow restrictions so the modal expands naturally
code = code.replace(/<div className=\"min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 touch-pan-y \[-webkit-overflow-scrolling:touch\]([^\"]*)\">/g, 
  '<div className="mt-4 space-y-4 $1">');
code = code.replace(/<div className=\"min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 touch-pan-y \[-webkit-overflow-scrolling:touch\]\">/g, 
  '<div className="mt-4">');
code = code.replace(/<div className=\"min-h-0 flex-1 overflow-y-auto pr-1 touch-pan-y \[-webkit-overflow-scrolling:touch\]\">/g, 
  '<div className="mt-4">');

// 2. FIX ACTION BUTTONS (Ações Rápidas):
// Point Novo Aluno directly to /alunos
code = code.replace(/onClick=\{[^\}]*setShowQuickActionModal\(\"novo-aluno\"\)[^\}]*\}/g, 
  'onClick={() => { haptic(20); router.push("/alunos?new=true"); }}');
// Point Nova Aula directly to /agenda
code = code.replace(/onClick=\{[^\}]*setShowQuickActionModal\(\"nova-aula\"\)[^\}]*\}/g, 
  'onClick={() => { haptic(20); router.push("/agenda?new=true"); }}');

// 3. FIX ESCALAÇÃO DE HOJE (Make it click to Court Board / Agenda)
code = code.replace(/onClick=\{[^\}]*setShowCourtModal\(true\)[^\}]*\}/g, 
  'onClick={() => { haptic(15); router.push("/agenda"); }}');

// 4. FIX PRIORIDADES (Make them clickable to routes instead of modals)
code = code.replace(/if \(priority\.action === \"financeiro\"\) setShowFinancialModal\(true\);/g, 
  'if (priority.action === "financeiro") router.push("/financeiro");');
code = code.replace(/if \(priority\.action === \"agenda\"\) setShowCourtModal\(true\);/g, 
  'if (priority.action === "agenda") router.push("/agenda");');
code = code.replace(/if \(priority\.action === \"expansao\"\) \{[\s\S]*?\}/g, 
  'if (priority.action === "expansao") router.push("/alunos?filter=trial");');

fs.writeFileSync(path, code);
console.log('DOM Re-architected successfully.');
