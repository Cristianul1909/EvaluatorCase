// ==========================================
// CONFIGURARE API GOOGLE GEMINI
// ==========================================
const API_KEY = "AQ.Ab8RN6JQ4YBsWSAeayxl5uMY9SFuCCbur2dKfX7_PE_d1sEOoQ"; 
const AI_PERSONALITY = "Ești un asistent expert în analiza vizuală. Răspunzi clar, la obiect și identifici detaliile importante din imaginile primite, ținând cont de locația specificată."; 
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const uploadLabel = document.querySelector('.upload-label');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const previewGrid = document.getElementById('preview-grid');
    const removeAllBtn = document.getElementById('remove-all-images');
    
    // Noile câmpuri
    const countryInput = document.getElementById('location-country');
    const zoneInput = document.getElementById('location-zone');
    const promptInput = document.getElementById('ai-prompt');
    
    const submitBtn = document.getElementById('submit-btn');
    const resultSection = document.getElementById('result-section');
    const aiResponse = document.getElementById('ai-response');

    let selectedImages = [];

    // Verificăm dacă TOATE câmpurile de text sunt completate și dacă avem imagini
    const checkSubmitState = () => {
        if (
            selectedImages.length > 0 && 
            countryInput.value.trim() !== '' &&
            zoneInput.value.trim() !== '' &&
            promptInput.value.trim() !== ''
        ) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    };

    const renderImages = () => {
        previewGrid.innerHTML = ''; 

        if (selectedImages.length > 0) {
            uploadLabel.classList.add('hidden');
            imagePreviewContainer.classList.remove('hidden');

            selectedImages.forEach((imageObj, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-wrapper';

                const img = document.createElement('img');
                img.src = imageObj.dataUrl;
                img.alt = `Imaginea ${index + 1}`;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-single-btn';
                removeBtn.innerHTML = '&times;'; 
                removeBtn.title = "Șterge această imagine";
                
                removeBtn.onclick = () => {
                    selectedImages.splice(index, 1);
                    renderImages();
                    checkSubmitState();
                };

                wrapper.appendChild(img);
                wrapper.appendChild(removeBtn);
                previewGrid.appendChild(wrapper);
            });
        } else {
            uploadLabel.classList.remove('hidden');
            imagePreviewContainer.classList.add('hidden');
            imageUpload.value = ''; 
        }
    };

    imageUpload.addEventListener('change', function(e) {
        const filesArray = Array.from(e.target.files);
        
        filesArray.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    selectedImages.push({
                        file: file,
                        dataUrl: event.target.result,
                        base64Data: event.target.result.split(',')[1],
                        mimeType: file.type
                    });
                    
                    renderImages();
                    checkSubmitState();
                };
                reader.readAsDataURL(file);
            }
        });
    });

    removeAllBtn.addEventListener('click', () => {
        selectedImages = [];
        renderImages();
        checkSubmitState();
    });

    // Ascultăm modificările pe toate cele 3 câmpuri
    countryInput.addEventListener('input', checkSubmitState);
    zoneInput.addEventListener('input', checkSubmitState);
    promptInput.addEventListener('input', checkSubmitState);

    submitBtn.addEventListener('click', async () => {
        const countryText = countryInput.value.trim();
        const zoneText = zoneInput.value.trim();
        const promptText = promptInput.value.trim();
        
        // Construim promptul final structurat pe care îl citește de fapt AI-ul
        const finalPromptText = `Context: Analizează imaginile următoare.
Locație: Țara - ${countryText}, Zona/Cod Poștal - ${zoneText}.
Instrucțiuni specifice utilizator: ${promptText}`;

        submitBtn.disabled = true;
        promptInput.disabled = true;
        countryInput.disabled = true;
        zoneInput.disabled = true;
        removeAllBtn.disabled = true;
        document.querySelectorAll('.remove-single-btn').forEach(btn => btn.disabled = true);
        
        resultSection.classList.remove('hidden');
        aiResponse.innerHTML = `
            <div class="loader"></div> 
            <span style="vertical-align: middle;">Gemini analizează imaginile și parametrii...</span>
        `;

        const apiParts = [{ text: finalPromptText }];
        
        selectedImages.forEach(imgObj => {
            apiParts.push({
                inline_data: {
                    mime_type: imgObj.mimeType,
                    data: imgObj.base64Data
                }
            });
        });

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;
            
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: AI_PERSONALITY }]
                    },
                    contents: [{
                        parts: apiParts
                    }]
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            let formattedResponse = data.candidates[0].content.parts[0].text;
            formattedResponse = formattedResponse.replace(/\n/g, '<br>');
            
            aiResponse.innerHTML = `<strong>Răspuns:</strong><br><br>${formattedResponse}`;

        } catch (error) {
            console.error("Eroare API:", error);
            aiResponse.innerHTML = `<span style="color: red;">Eroare: ${error.message}</span>`;
        } finally {
            submitBtn.disabled = false;
            promptInput.disabled = false;
            countryInput.disabled = false;
            zoneInput.disabled = false;
            removeAllBtn.disabled = false;
            document.querySelectorAll('.remove-single-btn').forEach(btn => btn.disabled = false);
        }
    });
});