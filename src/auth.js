// Supabase Auth adapter. Only the public publishable key is used by the browser.
// The database, not this module, decides which subscription is permitted.
export const SUPABASE_URL="https://yafgjhloxphtfrgmpwvd.supabase.co";
export const SUPABASE_PUBLIC_KEY="sb_publishable_-aPr6X1ml5KUSqlvzXYj2g_EPEcwUxl";
const STORAGE_KEY="lotolab.auth.session.v1";
const headers={"apikey":SUPABASE_PUBLIC_KEY,"Content-Type":"application/json"};
let session=null;
let refreshTask=null;
let recoveryToken=null;

export function activeEntitlement(row,now=Date.now()){
  if(!row||!["essential","advanced"].includes(row.plan)||row.access_status!=="active")return null;
  const begin=Date.parse(row.valid_from),end=Date.parse(row.valid_until);
  if(!Number.isFinite(begin)||!Number.isFinite(end)||begin>now||end<=now)return null;
  return {plan:row.plan,valid_until:row.valid_until};
}
export function planAllows(plan,feature){
  if(feature==="basic")return plan==="essential"||plan==="advanced";
  if(feature==="advanced")return plan==="advanced";
  return false;
}
function persist(value){
  session=value;
  try{
    if(value)sessionStorage.setItem(STORAGE_KEY,JSON.stringify(value));
    else sessionStorage.removeItem(STORAGE_KEY);
  }catch{/* Restricted storage: current tab remains functional. */}
}
export function restoreSession(){
  if(session)return session;
  try{
    const stored=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||"null");
    if(stored&&typeof stored.access_token==="string"&&typeof stored.refresh_token==="string"
       &&Number.isFinite(stored.expires_at)){
      session=stored;
    }
  }catch{/* Ignore tampered storage. */}
  return session;
}
export function clearSession(){persist(null);}
export function sessionEmail(){return session?.user?.email||"";}
async function authCall(path,body,method="POST",token){
  const resp=await fetch(SUPABASE_URL+"/auth/v1/"+path,{
    method,headers:{...headers,...(token?{Authorization:"Bearer "+token}:{})},
    ...(body?{body:JSON.stringify(body)}:{}),cache:"no-store"
  });
  const data=await resp.json().catch(()=>({}));
  if(!resp.ok)throw Error(data.msg||data.error_description||data.message||"Não foi possível autenticar. Confira seus dados.");
  return data;
}
function saveTokens(data,existingUser){
  if(!data?.access_token||!data?.refresh_token)throw Error("Sessão ainda não disponível. Confirme seu cadastro pelo e-mail.");
  persist({access_token:data.access_token,refresh_token:data.refresh_token,
    expires_at:Math.floor(Date.now()/1000)+(Number(data.expires_in)||3600),
    user:data.user||existingUser||null});
  return session;
}
export async function signIn(email,password){
  const data=await authCall("token?grant_type=password",{email,password});
  return saveTokens(data);
}
export async function signUp(email,password){
  const data=await authCall("signup",{email,password});
  if(data.access_token&&data.refresh_token){
    saveTokens(data);
    return {signedIn:true};
  }
  return {signedIn:false,message:"Cadastro enviado. Confirme o endereço de e-mail para ativar a conta."};
}

function safeRedirectOrigin(origin){
  const url=new URL(origin);
  if(url.protocol!=="https:"&&!(url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname)))throw Error("Origem de retorno inválida.");
  return url.origin+"/";
}
// The token exchange happens in the browser after clicking the Supabase-generated email link.
// No passwords or recovery tokens are included in an outgoing email or analytics event.
export async function requestPasswordReset(email,origin){
  const redirect=safeRedirectOrigin(origin);
  await authCall("recover?redirect_to="+encodeURIComponent(redirect),{email});
  return "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.";
}
export function extractAuthRedirect(hash){
  const params=new URLSearchParams(String(hash||"").replace(/^#/,""));
  const type=params.get("type");
  if(type==="recovery"&&params.get("access_token")){
    return {type:"recovery",access_token:params.get("access_token")};
  }
  if(["signup","magiclink","invite"].includes(type)&&params.get("access_token")&&params.get("refresh_token")){
    return {type:"login",access_token:params.get("access_token"),refresh_token:params.get("refresh_token"),
      expires_in:Number(params.get("expires_in")||3600)};
  }
  if(params.has("error"))return {type:"error",message:params.get("error_description")||"Link inválido ou expirado."};
  return {type:"none"};
}
export async function consumeAuthRedirect(hash){
  const parsed=extractAuthRedirect(hash);
  if(parsed.type==="recovery"){
    recoveryToken=parsed.access_token;
    // Check the recovery session against Auth before allowing password updates.
    const user=await authCall("user",null,"GET",recoveryToken);
    if(!user?.id){recoveryToken=null;throw Error("O link de recuperação expirou. Solicite outro.");}
    return {type:"recovery"};
  }
  if(parsed.type==="login"){
    saveTokens(parsed);
    return {type:"login"};
  }
  return parsed;
}
export async function updateRecoveredPassword(password){
  if(typeof password!=="string"||password.length<10)throw Error("Informe uma senha com pelo menos 10 caracteres.");
  if(!recoveryToken)throw Error("Solicite um novo link de recuperação.");
  const token=recoveryToken;
  try {
    await authCall("user",{password},"PUT",token);
    return {success:true};
  } finally {
    recoveryToken=null;
    clearSession();
  }
}

export async function signOut(){
  const previous=session;
  clearSession();
  if(previous?.access_token){
    try{await authCall("logout",null,"POST",previous.access_token);}
    catch{/* Do not restore a local session after sign-out. */}
  }
}
export async function getAccessToken(){
  const value=restoreSession();
  if(!value)return null;
  if(value.expires_at*1000>Date.now()+60_000)return value.access_token;
  if(!refreshTask)refreshTask=(async()=>{
    try{
      const data=await authCall("token?grant_type=refresh_token",{refresh_token:value.refresh_token});
      return saveTokens(data,value.user).access_token;
    }catch{
      clearSession();
      return null;
    }finally{refreshTask=null;}
  })();
  return refreshTask;
}
export async function verifyUser(){
  const token=await getAccessToken();
  if(!token)return null;
  try{
    const user=await authCall("user",null,"GET",token);
    if(!user?.id){clearSession();return null;}
    if(session){session.user=user;persist(session);}
    return user;
  }catch{
    clearSession();
    return null;
  }
}
export async function fetchEntitlement(){
  const token=await getAccessToken();
  if(!token)return null;
  const q=new URLSearchParams({select:"plan,access_status,valid_from,valid_until",limit:"1"});
  const resp=await fetch(SUPABASE_URL+"/rest/v1/lotolab_analysis_access?"+q,{
    headers:{"apikey":SUPABASE_PUBLIC_KEY,"Authorization":"Bearer "+token,"Accept":"application/json"},
    cache:"no-store"
  });
  if(!resp.ok)throw Error("Não foi possível confirmar as permissões da assinatura.");
  const rows=await resp.json();
  return activeEntitlement(Array.isArray(rows)?rows[0]:null);
}
export async function fetchAdvancedComparison(modality,windowSize){
  const token=await getAccessToken();
  if(!token)throw Error("Entre na sua conta para acessar os relatórios.");
  const response=await fetch(SUPABASE_URL+"/rest/v1/rpc/lotolab_advanced_comparison",{
    method:"POST",headers:{"apikey":SUPABASE_PUBLIC_KEY,"Authorization":"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify({p_modality_code:modality,p_window:windowSize}),cache:"no-store"
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error("Comparação indisponível para a assinatura atual.");
  return data;
}
