const brandColor = '#6F4E37';
const backgroundColor = '#F7EFE5';

export const authTemplates = {
  verification: (name: string, url: string) => `
  <div style="margin:0;padding:0;background-color:${backgroundColor};font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
            
            <tr>
              <td style="background:${brandColor};padding:28px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:3px;">
                  NOKU COFFEE
                </h1>
                <p style="margin:8px 0 0;color:#EAD8C5;font-size:13px;">
                  Pilihan Terbaik untuk Kebutuhan Kopimu
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 32px;color:#4A3728;">
                <h2 style="margin-top:0;font-size:20px;">
                  Halo, ${name}
                </h2>

                <p style="font-size:15px;line-height:1.7;color:#555;">
                  Terima kasih telah bergabung dengan <b>Noku Coffee</b>.  
                  Kami sudah menyiapkan biji kopi terbaik untukmu, mohon konfirmasi alamat emailmu untuk mengaktifkan akun.
                </p>

                <div style="text-align:center;margin:36px 0;">
                  <a href="${url}"
                     style="background:${brandColor};color:#ffffff;text-decoration:none;
                            padding:14px 34px;border-radius:6px;
                            font-size:15px;font-weight:bold;
                            display:inline-block;">
                    Verifikasi Akun Saya
                  </a>
                </div>

                <p style="font-size:14px;color:#777;line-height:1.6;">
                  Link verifikasi ini berlaku selama <b>1 jam</b>.  
                  Jika kamu tidak pernah mendaftar di Noku Coffee, abaikan email ini.
                </p>

                <hr style="border:none;border-top:1px solid #EEE;margin:32px 0;">

                <p style="font-size:13px;color:#999;">
                  Butuh bantuan?  
                  Hubungi kami kapan saja — kami selalu siap menyeduh solusi terbaik untukmu
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#FAFAFA;padding:20px 30px;text-align:center;border-top:1px solid #EEE;">
                <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
                  © 2026 Noku Coffee <br/>
                  Bekasi, Jawa Barat, Indonesia
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
  `,
};
