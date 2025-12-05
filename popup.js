// Carregar status da extensão quando o popup abrir
document.addEventListener('DOMContentLoaded', function() {
  loadExtensionStatus();
});

// Switch de ligar/desligar
document.getElementById('extensionToggle').addEventListener('change', function(e) {
  const isEnabled = e.target.checked;
  chrome.storage.sync.set({ extensionEnabled: isEnabled }, function() {
    console.log('Status da extensão atualizado:', isEnabled);
  });
});

function loadExtensionStatus() {
  chrome.storage.sync.get(['extensionEnabled'], function(result) {
    const isEnabled = result.extensionEnabled !== false; // Padrão é true se não estiver definido
    document.getElementById('extensionToggle').checked = isEnabled;
  });
}
