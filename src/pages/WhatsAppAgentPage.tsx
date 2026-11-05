import React from 'react'
import { MessageCircle, Bot, Database, Workflow, FileText, HardDrive, GitBranch, ArrowDown, BookOpen, Send, GraduationCap, Info } from 'lucide-react'

const Step=({icon,title,detail}: {icon:React.ReactNode;title:string;detail:string})=><div className="flex gap-3 items-start rounded-xl border border-gray-200 bg-white p-4"><div className="rounded-lg bg-gray-50 p-2 text-gray-700">{icon}</div><div className="min-w-0"><div className="text-sm font-semibold text-gray-900">{title}</div><p className="mt-1 text-xs leading-relaxed text-gray-500">{detail}</p></div></div>
const FlowArrow=()=> <div className="flex justify-center py-1 text-gray-300"><ArrowDown size={17}/></div>
export function WhatsAppAgentPage(){
 const courses=['BSc Nursing','GNM','Post Basic BSc Nursing','MSc Nursing']
 return <div className="space-y-6">
  <div><h1 className="text-2xl font-bold text-gray-900">WhatsApp Agent</h1><p className="mt-1 text-sm text-gray-500">How the Carmel College WhatsApp automation works in n8n.</p></div>
  <div className="grid gap-4 sm:grid-cols-3">
   <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex items-center gap-2 text-xs text-gray-500"><Workflow size={15}/> Main workflow</div><div className="mt-2 text-lg font-semibold text-gray-900">WhatsApp AI Agent</div><p className="mt-1 text-xs text-gray-500">Receives messages, retrieves college information and responds.</p></div>
   <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex items-center gap-2 text-xs text-gray-500"><FileText size={15}/> Subworkflow</div><div className="mt-2 text-lg font-semibold text-gray-900">Brochure delivery</div><p className="mt-1 text-xs text-gray-500">Routes course requests and sends the matching PDF.</p></div>
   <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex items-center gap-2 text-xs text-gray-500"><Database size={15}/> Knowledge</div><div className="mt-2 text-lg font-semibold text-gray-900">Supabase vector store</div><p className="mt-1 text-xs text-gray-500">Used by n8n for retrieval; dashboard does not access it.</p></div>
  </div>
  <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
   <div className="mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-green-600"/><div><h2 className="text-sm font-semibold text-gray-900">Workflow 1 · Main WhatsApp AI Agent</h2><p className="text-xs text-gray-500">Incoming enquiry to automated reply</p></div></div>
   <div className="mx-auto max-w-2xl">
    <Step icon={<MessageCircle size={18}/>} title="WhatsApp Trigger" detail="Receives incoming WhatsApp messages from the customer."/><FlowArrow/>
    <Step icon={<Bot size={18}/>} title="AI Agent · GPT-5 mini" detail="Understands the customer's message, follows the college assistant instructions and decides whether a brochure tool is needed."/><FlowArrow/>
    <div className="grid gap-3 sm:grid-cols-2"><Step icon={<Database size={18}/>} title="Supabase Vector Store" detail="Retrieves relevant college information from the existing documents knowledge base."/><Step icon={<Workflow size={18}/>} title="Brochure subworkflow tool" detail="Called by the AI when a customer requests a course brochure. Passes course and WhatsApp phone number."/></div><FlowArrow/>
    <Step icon={<Send size={18}/>} title="WhatsApp Send Message" detail="Sends the AI Agent's text response back to the customer. Brochure documents are sent by the separate subworkflow."/>
   </div>
  </section>
  <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
   <div className="mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600"/><div><h2 className="text-sm font-semibold text-gray-900">Workflow 2 · Brochure delivery subworkflow</h2><p className="text-xs text-gray-500">Triggered by the main AI agent when a brochure is requested</p></div></div>
   <div className="mx-auto max-w-2xl"><Step icon={<Workflow size={18}/>} title="Execute Workflow Trigger" detail="Receives the selected course and customer's WhatsApp phone number."/><FlowArrow/><Step icon={<GitBranch size={18}/>} title="Course routing" detail="Switch node checks which course brochure was requested."/><div className="my-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{courses.map(c=><div key={c} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-3 text-xs font-medium text-gray-700"><GraduationCap size={15} className="text-blue-600"/>{c}</div>)}</div><FlowArrow/><Step icon={<HardDrive size={18}/>} title="Google Drive · Download PDF" detail="Downloads the matching brochure file for the selected course."/><FlowArrow/><Step icon={<Send size={18}/>} title="WhatsApp · Send document" detail="Sends the PDF to the phone number passed in from the main workflow."/></div>
  </section>
  <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
   <div className="mb-3 flex items-center gap-2"><BookOpen size={18} className="text-violet-600"/><h2 className="text-sm font-semibold text-gray-900">Knowledge-base and brochure file ingestion</h2></div>
   <div className="grid gap-3 sm:grid-cols-2"><Step icon={<HardDrive size={18}/>} title="Google Drive triggers" detail="The existing workflow watches the knowledge-base and brochure folders for file changes."/><Step icon={<Database size={18}/>} title="Supabase Vector Store · documents" detail="Files are processed and inserted into the existing documents table for retrieval. This table and its configuration remain untouched."/></div>
  </section>
  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900"><Info size={17} className="shrink-0"/><p><strong>Display note:</strong> This page documents the workflow structure from the supplied n8n exports. It is an architecture view, not a live execution monitor. No WhatsApp webhook, direct Supabase connection, or new workflow has been added to the dashboard.</p></div>
 </div>
}
