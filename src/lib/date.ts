export const formatDate = (/** @type {string | number | Date} */ value) => {
    const date = new Date(value);
    return new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'medium'
    }).format(date);
  };