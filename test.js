const eventSource = new EventSource('https://chat.openai.com/backend-api/conversation');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Xử lý dữ liệu từ sự kiện SSE ở đây
    console.log(data.message);
};

eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
};
