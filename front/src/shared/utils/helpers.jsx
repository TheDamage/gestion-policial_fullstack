// Debounce function
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Validate patente format
export const validatePatente = (patente) => {
  const cleaned = patente.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const oldFormat = /^[A-Z]{3}\d{3}$/;
  const newFormat = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
  return oldFormat.test(cleaned) || newFormat.test(cleaned);
};

// Format phone number
export const formatPhone = (phone) => {
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2-$3');
};

// Get initials
export const getInitials = (nombre, apellido) => {
  return `${nombre[0]}${apellido[0]}`.toUpperCase();
};