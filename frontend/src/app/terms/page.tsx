import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description:
    "Điều khoản sử dụng ParkWise Mini App — mô tả quyền Zalo và dữ liệu cá nhân.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-navy">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted">ParkWise · VNUK</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Điều khoản sử dụng &amp; Bảo vệ dữ liệu cá nhân
          </h1>
          <p className="text-sm text-muted">
            Áp dụng cho Mini App ParkWise trên Zalo và web ParkWise. Cập nhật:
            22/10/2026.
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-navy/90">
          <h2 className="text-base font-semibold text-navy">1. Giới thiệu</h2>
          <p>
            ParkWise là Mini App hỗ trợ đỗ xe và tiện ích sinh viên tại khuôn
            viên (đăng nhập, Backup Pass / QR, membership, điểm thưởng, Night-Owl
            theo dõi hành trình về nhà). Khi bạn mở và sử dụng Mini App, bạn
            đồng ý với Điều khoản này.
          </p>
          <p>
            Nhà phát triển / đơn vị vận hành: đội ngũ ParkWise (VNUK campus
            parking). Liên hệ hỗ trợ qua mục Trợ giúp trong ứng dụng hoặc kênh
            hỗ trợ campus.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-navy/90">
          <h2 className="text-base font-semibold text-navy">
            2. Quyền Zalo mà Mini App yêu cầu
          </h2>
          <p>
            ParkWise chỉ xin quyền khi cần cho tính năng tương ứng, sau khi bạn
            thao tác (ví dụ đăng nhập, bật Night-Owl). Bạn có thể đồng ý hoặc
            từ chối từng quyền. Từ chối không làm Mini App tự đóng; một số tính
            năng liên quan có thể không dùng được.
          </p>

          <h3 className="pt-2 font-semibold text-navy">
            2.1. Thông tin người dùng (userInfo)
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Dữ liệu:</strong> tên hiển thị Zalo, ảnh đại diện, mã
              định danh người dùng trên Zalo (nếu Zalo cung cấp).
            </li>
            <li>
              <strong>Mục đích:</strong> hiển thị tên / ảnh trên Home, gắn hồ
              sơ tài khoản đỗ xe với tài khoản Zalo.
            </li>
            <li>
              <strong>Hoàn cảnh xin quyền:</strong> khi bạn đăng nhập hoặc mở
              Mini App lần đầu cần nhận diện tài khoản.
            </li>
            <li>
              <strong>Lưu trữ:</strong> lưu trên máy chủ ParkWise tại Việt Nam
              để duy trì phiên đăng nhập và hồ sơ người dùng.
            </li>
          </ul>

          <h3 className="pt-2 font-semibold text-navy">
            2.2. Số điện thoại (userPhonenumber)
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Dữ liệu:</strong> số điện thoại gắn với tài khoản Zalo
              (qua API Zalo sau khi bạn đồng ý; Mini App nhận token rồi đổi lấy
              số trên máy chủ).
            </li>
            <li>
              <strong>Mục đích:</strong> đăng nhập / liên kết tài khoản ParkWise
              với SĐT; xác định chủ thẻ xe, Backup Pass và dịch vụ đỗ xe campus.
            </li>
            <li>
              <strong>Hoàn cảnh xin quyền:</strong> khi bạn chọn đăng nhập bằng
              Zalo hoặc liên kết số điện thoại.
            </li>
            <li>
              <strong>Lưu trữ:</strong> số điện thoại được lưu trên máy chủ
              ParkWise để xác thực và liên hệ hỗ trợ dịch vụ đỗ xe; không bán
              hoặc chia sẻ cho bên thứ ba vì mục đích quảng cáo.
            </li>
          </ul>

          <h3 className="pt-2 font-semibold text-navy">
            2.3. Vị trí (userLocation)
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Dữ liệu:</strong> tọa độ / vị trí thiết bị hiện tại trong
              thời gian bạn bật phiên Night-Owl.
            </li>
            <li>
              <strong>Mục đích:</strong> hiển thị hành trình trên bản đồ để
              người thân theo dõi khi bạn về nhà (tính năng Night-Owl / Safe
              Ride).
            </li>
            <li>
              <strong>Hoàn cảnh xin quyền:</strong> chỉ khi bạn chủ động bật
              Night-Owl và chia sẻ liên kết theo dõi; không thu thập vị trí nền
              khi bạn không dùng tính năng này.
            </li>
            <li>
              <strong>Lưu trữ &amp; chia sẻ:</strong> vị trí gắn với phiên theo
              dõi có thời hạn; người nhận chỉ xem được qua liên kết bạn chia sẻ
              trong thời gian phiên còn hiệu lực. Bạn có thể dừng phiên bất kỳ
              lúc nào.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-navy/90">
          <h2 className="text-base font-semibold text-navy">
            3. Dữ liệu cá nhân khác do bạn cung cấp
          </h2>
          <p>Ngoài dữ liệu từ Zalo, bạn có thể cung cấp hoặc hệ thống ghi nhận:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Thông tin phương tiện (biển số, loại xe) gắn với tài khoản.</li>
            <li>
              Lịch sử đỗ xe, Backup Pass / QR, membership, điểm thưởng trong
              phạm vi dịch vụ campus.
            </li>
            <li>
              Nội dung hỗ trợ (SOS / chat trợ giúp) khi bạn chủ động gửi.
            </li>
          </ul>
          <p>
            Mục đích: vận hành cổng/bãi đỗ, xác minh quyền vào ra, membership và
            hỗ trợ sinh viên.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-navy/90">
          <h2 className="text-base font-semibold text-navy">
            4. Cơ sở pháp lý &amp; đồng ý
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Mini App chỉ gọi API quyền nhạy cảm (SĐT, vị trí, thông tin user)
              sau khi bạn đồng ý trên giao diện Zalo / Mini App.
            </li>
            <li>
              Mục đích và phạm vi sử dụng được thông báo tại Điều khoản này và
              tại thời điểm xin quyền.
            </li>
            <li>
              Nếu bạn từ chối cấp quyền, ParkWise không tiếp tục xử lý dữ liệu
              thuộc quyền đó và không tự đóng Mini App.
            </li>
            <li>
              Bạn có thể rút lại đồng ý bằng cách thu hồi quyền trong cài đặt
              Zalo / Mini App; khi Zalo gửi sự kiện thu hồi đồng ý, ParkWise sẽ
              ngừng dùng dữ liệu tương ứng theo quy trình hệ thống.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-navy/90">
          <h2 className="text-base font-semibold text-navy">
            5. Lưu trữ, bảo mật &amp; chia sẻ
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Dữ liệu được xử lý và lưu trữ phục vụ vận hành dịch vụ trên hạ
              tầng máy chủ phục vụ người dùng tại Việt Nam.
            </li>
            <li>
              Không bán dữ liệu cá nhân. Chỉ chia sẻ khi bạn chủ động (ví dụ
              chia sẻ link Night-Owl), khi cần vận hành dịch vụ đỗ xe campus,
              hoặc khi pháp luật yêu cầu.
            </li>
            <li>
              Áp dụng biện pháp kỹ thuật hợp lý để bảo vệ dữ liệu khỏi truy cập
              trái phép.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-navy/90">
          <h2 className="text-base font-semibold text-navy">
            6. Quyền của chủ thể dữ liệu
          </h2>
          <p>Theo quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân, bạn có quyền:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Được biết mục đích, phạm vi dữ liệu được xử lý.</li>
            <li>Đồng ý hoặc từ chối / rút lại đồng ý.</li>
            <li>Truy cập, chỉnh sửa thông tin hồ sơ trong khả năng hệ thống hỗ trợ.</li>
            <li>Yêu cầu xóa hoặc hạn chế xử lý dữ liệu khi đủ điều kiện pháp lý.</li>
          </ul>
          <p>
            Gửi yêu cầu qua kênh hỗ trợ campus / Trợ giúp trong ứng dụng; chúng
            tôi sẽ phản hồi trong thời hạn phù hợp theo quy định.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-navy/90">
          <h2 className="text-base font-semibold text-navy">7. Trách nhiệm sử dụng</h2>
          <p>
            Không dùng ParkWise để gian lận, giả mạo thẻ/QR, truy cập trái phép
            hoặc xâm phạm quyền riêng tư người khác (kể cả lạm dụng Night-Owl).
            Dịch vụ hỗ trợ vận hành đỗ xe; không thay thế cứu hộ khẩn cấp.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-navy/90">
          <h2 className="text-base font-semibold text-navy">8. Thay đổi điều khoản</h2>
          <p>
            Khi cập nhật Điều khoản, ngày “Cập nhật” ở đầu trang sẽ được chỉnh
            sửa. Việc tiếp tục sử dụng Mini App sau khi cập nhật đồng nghĩa bạn
            chấp nhận phiên bản mới, trừ khi pháp luật yêu cầu hình thức đồng ý
            khác.
          </p>
        </section>

        <p className="pt-4 text-sm text-muted">
          <Link
            href="/"
            className="text-primary underline-offset-2 hover:underline"
          >
            ← Về ParkWise
          </Link>
        </p>
      </div>
    </main>
  );
}
