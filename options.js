// Verificar se PIN já foi definido
document.addEventListener('DOMContentLoaded', function() {
  checkPinStatus();
  setupEventListeners();
});

function setupEventListeners() {
  // Botão de confirmar PIN
  document.getElementById('submitPinBtn').addEventListener('click', handlePinSubmit);
  
  // Enter no campo de PIN
  document.getElementById('pinInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      // Chamar o onclick do botão, que já está configurado corretamente
      // (setup ou entry dependendo do estado)
      const submitBtn = document.getElementById('submitPinBtn');
      if (submitBtn.onclick) {
        submitBtn.onclick();
      } else {
        // Fallback para o comportamento padrão
        handlePinSubmit();
      }
    }
  });
  
  // Botão de cancelar PIN
  document.getElementById('cancelPinBtn').addEventListener('click', function() {
    window.close();
  });
  
  // Botão de adicionar palavra
  document.getElementById('addBtn').addEventListener('click', addKeyword);
  
  // Enter no campo de palavra
  document.getElementById('keywordInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addKeyword();
    }
  });
  
  // Event delegation para botões de remover e ícones de olho
  document.getElementById('keywordList').addEventListener('click', function(e) {
    if (e.target.closest('.remove-btn')) {
      const removeBtn = e.target.closest('.remove-btn');
      const keyword = removeBtn.getAttribute('data-keyword');
      if (keyword) {
        removeKeyword(keyword);
      }
    } else if (e.target.closest('.eye-icon')) {
      const eyeIcon = e.target.closest('.eye-icon');
      const keyword = eyeIcon.getAttribute('data-keyword');
      if (keyword) {
        toggleKeywordVisibility(keyword);
      }
    }
  });
  
  // Botões de mostrar/ocultar todos
  document.getElementById('showAllBtn').addEventListener('click', showAllKeywords);
  document.getElementById('hideAllBtn').addEventListener('click', hideAllKeywords);
}

function checkPinStatus() {
  chrome.storage.sync.get(['pin', 'pinDefined'], function(result) {
    // Verificar se PIN foi realmente definido (deve existir pinDefined === true E um pin válido)
    if (result.pinDefined === true && result.pin && result.pin.trim() !== '') {
      // PIN já definido - pedir para digitar
      showPinEntry();
    } else {
      // Primeiro acesso ou PIN não definido - pedir para definir PIN
      showPinSetup();
    }
  });
}

function showPinSetup() {
  const pinScreen = document.getElementById('pinScreen');
  const pinLabel = document.getElementById('pinLabel');
  const pinInput = document.getElementById('pinInput');
  const submitBtn = document.getElementById('submitPinBtn');
  const errorMsg = document.getElementById('pinError');
  
  pinScreen.classList.add('active');
  pinLabel.textContent = 'Defina um PIN (máximo 10 dígitos):';
  pinInput.value = '';
  pinInput.placeholder = 'Digite um PIN';
  errorMsg.classList.remove('show');
  
  // Mudar comportamento do botão para criar PIN
  submitBtn.onclick = function() {
    const pin = pinInput.value.trim();
    
    if (pin === '') {
      errorMsg.textContent = 'Por favor, digite um PIN!';
      errorMsg.classList.add('show');
      return;
    }
    
    if (pin.length < 4) {
      errorMsg.textContent = 'O PIN deve ter pelo menos 4 dígitos!';
      errorMsg.classList.add('show');
      return;
    }
    
    if (pin.length > 10) {
      errorMsg.textContent = 'O PIN deve ter no máximo 10 dígitos!';
      errorMsg.classList.add('show');
      return;
    }
    
    // Salvar PIN
    chrome.storage.sync.set({
      pin: pin,
      pinDefined: true
    }, function() {
      // Mostrar tela de configurações
      showSettings();
    });
  };
}

function showPinEntry() {
  const pinScreen = document.getElementById('pinScreen');
  const pinLabel = document.getElementById('pinLabel');
  const pinInput = document.getElementById('pinInput');
  const errorMsg = document.getElementById('pinError');
  
  pinScreen.classList.add('active');
  pinLabel.textContent = 'Digite o PIN:';
  pinInput.value = '';
  pinInput.placeholder = 'Digite seu PIN';
  errorMsg.classList.remove('show');
  pinInput.focus();
  
  // Restaurar comportamento padrão do botão
  document.getElementById('submitPinBtn').onclick = handlePinSubmit;
}

function handlePinSubmit() {
  const pinInput = document.getElementById('pinInput');
  const enteredPin = pinInput.value.trim();
  const errorMsg = document.getElementById('pinError');
  
  if (enteredPin === '') {
    errorMsg.textContent = 'Por favor, digite o PIN!';
    errorMsg.classList.add('show');
    return;
  }
  
  // Verificar PIN
  chrome.storage.sync.get(['pin'], function(result) {
    if (result.pin === enteredPin) {
      // PIN correto - mostrar configurações
      showSettings();
    } else {
      // PIN incorreto
      errorMsg.textContent = 'PIN incorreto!';
      errorMsg.classList.add('show');
      pinInput.value = '';
      pinInput.focus();
    }
  });
}

function showSettings() {
  const pinScreen = document.getElementById('pinScreen');
  const settingsScreen = document.getElementById('settingsScreen');
  
  pinScreen.classList.remove('active');
  settingsScreen.classList.add('active');
  
  // Carregar palavras
  loadKeywords();
  
  // Focar no campo de input
  document.getElementById('keywordInput').focus();
}

function addKeyword() {
  const input = document.getElementById('keywordInput');
  const keyword = input.value.trim();
  
  if (keyword === '') return;
  
  // Obter palavras existentes e visibilidade
  chrome.storage.sync.get(['keywords', 'keywordVisibility'], function(result) {
    const keywords = result.keywords || [];
    const visibility = result.keywordVisibility || {};
    
    // Verificar se a palavra já existe
    if (keywords.includes(keyword)) {
      alert('Esta palavra já foi adicionada!');
      return;
    }
    
    // Adicionar nova palavra (padrão é oculto)
    keywords.push(keyword);
    visibility[keyword] = false;
    
    // Salvar no storage
    chrome.storage.sync.set({ 
      keywords: keywords,
      keywordVisibility: visibility
    }, function() {
      input.value = '';
      loadKeywords();
    });
  });
}

function removeKeyword(keywordToRemove) {
  chrome.storage.sync.get(['keywords', 'keywordVisibility'], function(result) {
    const keywords = result.keywords || [];
    const visibility = result.keywordVisibility || {};
    const filteredKeywords = keywords.filter(keyword => keyword !== keywordToRemove);
    
    // Remover também da visibilidade
    delete visibility[keywordToRemove];
    
    chrome.storage.sync.set({ 
      keywords: filteredKeywords,
      keywordVisibility: visibility
    }, function() {
      loadKeywords();
    });
  });
}

function censorKeyword(keyword) {
  if (!keyword || keyword.length === 0) return '';
  if (keyword.length === 1) return keyword;
  return keyword[0] + '*'.repeat(keyword.length - 1);
}

function loadKeywords() {
  chrome.storage.sync.get(['keywords', 'keywordVisibility'], function(result) {
    const keywords = result.keywords || [];
    const visibility = result.keywordVisibility || {};
    const keywordList = document.getElementById('keywordList');
    const controls = document.querySelector('.keyword-list-controls');
    
    keywordList.innerHTML = '';
    
    if (keywords.length === 0) {
      keywordList.innerHTML = '<div class="empty-state">Nenhuma palavra adicionada ainda.</div>';
      if (controls) controls.classList.remove('visible');
      return;
    }
    
    // Mostrar controles se houver palavras
    if (controls) controls.classList.add('visible');
    
    keywords.forEach(keyword => {
      const keywordItem = document.createElement('div');
      keywordItem.className = 'keyword-item';
      // Padrão é oculto (false), então se não estiver definido ou for false, está oculto
      const isVisible = visibility[keyword] === true;
      
      // Mostrar palavra completa ou censurada
      const displayText = isVisible ? keyword : censorKeyword(keyword);
      
      // Ícone de olho (aberto = visível, fechado = oculto)
      const eyeIconSvg = isVisible 
        ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>'
        : '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>';
      
      // Ícone de lixeira
      const trashIconSvg = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
      
      keywordItem.innerHTML = `
        <div class="keyword-item-content">
          <span>${escapeHtml(displayText)}</span>
        </div>
        <div class="keyword-item-actions">
          <div class="eye-icon" data-keyword="${escapeHtml(keyword)}" title="${isVisible ? 'Ocultar' : 'Mostrar'}">
            ${eyeIconSvg}
          </div>
          <button class="remove-btn" data-keyword="${escapeHtml(keyword)}" title="Remover">
            ${trashIconSvg}
          </button>
        </div>
      `;
      
      keywordList.appendChild(keywordItem);
    });
  });
}

function toggleKeywordVisibility(keyword) {
  chrome.storage.sync.get(['keywordVisibility'], function(result) {
    const visibility = result.keywordVisibility || {};
    // Toggle: se está true (visível), vira false (oculto), e vice-versa
    visibility[keyword] = visibility[keyword] === true ? false : true;
    
    chrome.storage.sync.set({ keywordVisibility: visibility }, function() {
      loadKeywords();
    });
  });
}

function showAllKeywords() {
  chrome.storage.sync.get(['keywords', 'keywordVisibility'], function(result) {
    const keywords = result.keywords || [];
    const visibility = result.keywordVisibility || {};
    
    // Marcar todos como visíveis (mostrar texto completo)
    keywords.forEach(keyword => {
      visibility[keyword] = true;
    });
    
    chrome.storage.sync.set({ keywordVisibility: visibility }, function() {
      loadKeywords();
    });
  });
}

function hideAllKeywords() {
  chrome.storage.sync.get(['keywords', 'keywordVisibility'], function(result) {
    const keywords = result.keywords || [];
    const visibility = result.keywordVisibility || {};
    
    // Marcar todos como ocultos (censurar com asteriscos)
    keywords.forEach(keyword => {
      visibility[keyword] = false;
    });
    
    chrome.storage.sync.set({ keywordVisibility: visibility }, function() {
      loadKeywords();
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
