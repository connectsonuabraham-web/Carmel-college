import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWhatsApp, fetchWhatsAppConfig, sendWhatsAppMessage, controlWhatsAppAI, type WhatsAppResource } from '../api/whatsapp'
const options = { refetchInterval: 15000, retry: 1 }
export const useWhatsAppRows = (resource: WhatsAppResource) => useQuery({queryKey:['whatsapp',resource],queryFn:()=>fetchWhatsApp(resource),...options})
export const useWhatsAppConfig = () => useQuery({queryKey:['whatsapp','config'],queryFn:fetchWhatsAppConfig,refetchInterval:60000})
export function useSendWhatsAppMessage() {
 const qc=useQueryClient()
 return useMutation({mutationFn:({phone,message,conversation_id}:{phone:string;message:string;conversation_id?:string})=>sendWhatsAppMessage(phone,message,conversation_id),onSuccess:()=>{qc.invalidateQueries({queryKey:['whatsapp']})}})
}
export function useWhatsAppAIControl() {
 const qc=useQueryClient()
 return useMutation({mutationFn:({phone,action,conversation_id}:{phone:string;action:'pause_ai'|'resume_ai';conversation_id?:string})=>controlWhatsAppAI(phone,action,conversation_id),onSuccess:()=>qc.invalidateQueries({queryKey:['whatsapp']})})
}
