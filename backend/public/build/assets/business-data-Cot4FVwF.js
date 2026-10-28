import{c as n,b as i,I as s}from"./app-tq1HDe_v.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=n("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=n("Pen",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=n("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);function m(t,r,e,a){const o=r,d={preserveScroll:!0,onSuccess:()=>{s.success("Data berhasil disimpan ke database."),a==null||a()},onError:l=>{const p=Object.values(l).find(Boolean);s.error(p??"Data belum dapat disimpan. Periksa kembali isian formulir.")}};if(e){i.put(`/business-data/${t}/${encodeURIComponent(e)}`,o,d);return}i.post(`/business-data/${t}`,o,d)}function b(t,r,e,a){i.delete(`/business-data/${t}/${encodeURIComponent(r)}`,{data:e?{reason:e}:{},preserveScroll:!0,onSuccess:()=>{s.success("Data berhasil dinonaktifkan."),a==null||a()},onError:()=>{s.error("Data belum dapat dinonaktifkan. Periksa hak akses dan relasi data.")}})}export{c as C,u as P,h as S,b as a,m as s};
