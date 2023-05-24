
// /** Avoid double registration of a customElement */
// function safeDecorator(fn:any) {
//   // eslint-disable-next-line func-names
//   return function(...args:any) {
//     try {
//       // @ts-ignore
//       return fn.apply(this, args);
//     } catch (error) {
//       if (
//         error instanceof DOMException &&
//         //error.message.includes('has already been used with this registry')
//         error.message.includes('has already been defined as a custom element')
//       ) {
//         console.warn("Double customElements.define waived")
//         return false;
//       }
//       throw error;
//     }
//   };
// }
// customElements.define = safeDecorator(customElements.define);
