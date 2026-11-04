// TASLAK: KVKK metinleri yayından önce hukukçu tarafından kontrol edilmelidir.
window.GK_METIN = {
  kvkk: {
    baslik: 'KVKK Bilgilendirmesi',
    html: `
<p>Bu formda paylaştığınız bilgiler, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işlenir. Bilgileriniz yalnız talebinize dönmek, ön keşif ve teklif sürecini yürütmek için kullanılır.</p>
<p>Formu göndermeden önce Aydınlatma Metni'ni okuyabilirsiniz. Kanun'un 11. maddesindeki haklarınızı kullanmak için <b>{{EPOSTA}}</b> adresine yazabilirsiniz.</p>
<p>Veri sorumlusu: <b>{{UNVAN}}</b></p>`
  },
  aydinlatma: {
    baslik: 'Aydınlatma Metni',
    html: `
<h3>Veri sorumlusu</h3>
<p><b>{{UNVAN}}</b>, {{ADRES}}. İletişim: {{EPOSTA}}</p>
<h3>İşlenen veriler</h3>
<p>Ad soyad, telefon numarası; formda seçtiğiniz il ve ilçe, mekan ve oda bilgisi, metrekare ve seri tercihi; sayfaya geldiğiniz reklam kaynağı bilgisi; bağlantı kurmak için kullandığınız arama ve WhatsApp düğmelerine dokunma kaydı.</p>
<h3>İşleme amaçları</h3>
<p>Talebinize dönmek, sizi aramak ya da size yazmak, ön keşif ve teklif hazırlamak, kampanya kapsamında müşteri eşleştirmesini yürütmek, kampanya sonuçlarını ölçmek.</p>
<h3>Hukuki sebep</h3>
<p>Bir sözleşmenin kurulması için gerekli olması ve meşru menfaat (Kanun m. 5/2-c, f). Açık rıza gerektiren işlemler için açık rızanız alınır.</p>
<h3>Aktarım</h3>
<p>Veriler, başvuruların saklandığı Supabase altyapısında tutulur. Bu altyapının sunucuları Türkiye dışındadır (Avrupa Birliği). Veriler, kampanyanın yürütülmesi için gerektiğinde Mitsubishi Electric kampanya sürecindeki ilgili taraflarla ve yasal zorunluluk halinde yetkili kurumlarla paylaşılabilir.</p>
<h3>Saklama süresi</h3>
<p>Veriler, işleme amacının gerektirdiği süre ve yasal saklama süreleri boyunca saklanır, sonrasında silinir ya da anonim hale getirilir.</p>
<h3>Haklarınız</h3>
<p>Kanun'un 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini ya da silinmesini isteme ve itiraz etme haklarına sahipsiniz. Başvuru için: {{EPOSTA}}</p>`
  }
};
